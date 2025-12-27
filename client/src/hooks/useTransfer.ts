import { useRef, useCallback } from 'react'
import type { Transfer, TransferMetadata, DataChannelControl, DataChannelMessage } from '../lib/types.ts'
import { createChunkIterator, extractChunkData } from '../lib/chunker.ts'
import { Reassembler } from '../lib/reassembler.ts'
import { useStore } from '../store/index.ts'
import { isURL } from '../lib/deviceInfo.ts'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const BUFFER_HIGH = 64 * 1024 * 1024    // 64MB — more in-flight data for speed
const BUFFER_LOW = 16 * 1024 * 1024     // 16MB

export interface TransferControls {
  sendFile: (peerId: string, file: File) => void
  sendFiles: (peerId: string, files: File[]) => void
  sendText: (peerId: string, text: string) => void
  cancelTransfer: (transferId: string) => void
  handleDataChannel: (peerId: string, dc: RTCDataChannel) => void
  onAcceptReceive: (transferId: string) => void
  onDeclineReceive: (transferId: string) => void
}

export function useTransfer(
  onReceiveRequest: (transfer: Transfer) => void,
  toastError: (msg: string) => void,
  toastInfo: (msg: string) => void,
): TransferControls {
  const { addTransfer, updateTransfer, removeTransfer, addHistoryEntry } = useStore()
  const reassemblers = useRef<Map<string, Reassembler>>(new Map())
  const activeDCs = useRef<Map<string, RTCDataChannel>>(new Map()) // peerId → DC
  const pendingSends = useRef<Map<string, (accepted: boolean) => void>>(new Map()) // transferId → resolver
  const speedWindows = useRef<Map<string, { totalBytes: number; startTime: number }>>(new Map())

  const trackSpeed = useCallback((transferId: string, bytes: number): number => {
    const win = speedWindows.current.get(transferId)
    if (!win) {
      speedWindows.current.set(transferId, { totalBytes: bytes, startTime: Date.now() })
      return 0
    }
    win.totalBytes += bytes
    const elapsed = (Date.now() - win.startTime) / 1000 || 0.001
    return win.totalBytes / elapsed
  }, [])

  const finishTransfer = useCallback((transferId: string, blobUrl?: string): void => {
    const transfer = useStore.getState().transfers.get(transferId)
    if (!transfer) return
    updateTransfer(transferId, { status: 'complete', progress: 100, blobUrl })
    addHistoryEntry({
      id: transferId,
      direction: transfer.direction,
      type: transfer.type,
      filename: transfer.filename,
      size: transfer.size,
      speed: transfer.speed,
      completedAt: new Date(),
      blobUrl,
      content: transfer.content,
    })
    speedWindows.current.delete(transferId)
    reassemblers.current.delete(transferId)
    setTimeout(() => removeTransfer(transferId), 3500)
  }, [updateTransfer, addHistoryEntry, removeTransfer])

  const sendChunks = useCallback(async (dc: RTCDataChannel, file: File, transferId: string): Promise<void> => {
    let bytesSent = 0
    for await (const { buffer } of createChunkIterator(file)) {
      if (dc.readyState !== 'open') { updateTransfer(transferId, { status: 'error' }); return }

      // Backpressure
      if (dc.bufferedAmount > BUFFER_HIGH) {
        await new Promise<void>((res) => {
          const poll = () => dc.bufferedAmount <= BUFFER_LOW ? res() : setTimeout(poll, 50)
          poll()
        })
      }

      dc.send(buffer)
      bytesSent += buffer.byteLength - 8
      const progress = Math.min((bytesSent / file.size) * 100, 99)
      const speed = trackSpeed(transferId, buffer.byteLength - 8)
      const eta = (file.size - bytesSent) / (speed || 1)
      updateTransfer(transferId, { progress, speed, eta })
    }
  }, [updateTransfer, trackSpeed])

  const sendFile = useCallback((peerId: string, file: File): void => {
    if (file.size > MAX_FILE_SIZE) { toastError(`"${file.name}" exceeds 100MB limit`); return }

    const dc = activeDCs.current.get(peerId)
    if (!dc || dc.readyState !== 'open') { toastError('Not connected to that device'); return }

    const transferId = crypto.randomUUID()
    const totalChunks = Math.ceil(file.size / (64 * 1024))
    const peers = useStore.getState().peers
    const peer = peers.get(peerId)

    const meta: TransferMetadata = {
      type: 'metadata', transferId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size, totalChunks,
      transferType: 'file',
    }
    dc.send(JSON.stringify(meta))

    addTransfer({
      id: transferId, peerId,
      peerName: peer?.deviceName ?? 'Unknown',
      peerEmoji: peer?.deviceEmoji ?? '📱',
      direction: 'send', type: 'file',
      filename: file.name, mimeType: file.type,
      size: file.size, totalChunks,
      progress: 0, speed: 0, eta: 0, status: 'pending',
    })

    // Wait for accepted/declined from receiver
    const waitForAccept = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => { pendingSends.current.delete(transferId); resolve(false) }, 31000)
      pendingSends.current.set(transferId, (accepted) => { clearTimeout(timer); resolve(accepted) })
    })

    void waitForAccept.then((accepted) => {
      if (!accepted) {
        updateTransfer(transferId, { status: 'declined' })
        setTimeout(() => removeTransfer(transferId), 2000)
        return
      }
      updateTransfer(transferId, { status: 'transferring' })
      return sendChunks(dc, file, transferId)
        .then(() => finishTransfer(transferId))
        .catch(() => updateTransfer(transferId, { status: 'error' }))
    })
  }, [addTransfer, updateTransfer, removeTransfer, sendChunks, finishTransfer, toastError])

  const sendFiles = useCallback((peerId: string, files: File[]): void => {
    for (const file of files) sendFile(peerId, file)
  }, [sendFile])

  const sendText = useCallback((peerId: string, text: string): void => {
    const dc = activeDCs.current.get(peerId)
    if (!dc || dc.readyState !== 'open') { toastError('Not connected to that device'); return }

    const transferType = isURL(text) ? 'link' : 'text'
    const transferId = crypto.randomUUID()
    const peers = useStore.getState().peers
    const peer = peers.get(peerId)
    const size = new TextEncoder().encode(text).byteLength
    const meta: TransferMetadata = {
      type: 'metadata', transferId,
      filename: transferType === 'link' ? 'Link' : 'Note',
      mimeType: 'text/plain', size,
      totalChunks: 0, transferType, content: text,
    }
    dc.send(JSON.stringify(meta))

    addTransfer({
      id: transferId, peerId,
      peerName: peer?.deviceName ?? 'Unknown',
      peerEmoji: peer?.deviceEmoji ?? '📱',
      direction: 'send', type: transferType,
      filename: meta.filename, mimeType: 'text/plain',
      size, totalChunks: 0,
      progress: 100, speed: 0, eta: 0, status: 'complete', content: text,
    })
    addHistoryEntry({ id: transferId, direction: 'send', type: transferType, filename: meta.filename, size, speed: 0, completedAt: new Date(), content: text })
    setTimeout(() => removeTransfer(transferId), 3000)
  }, [addTransfer, addHistoryEntry, removeTransfer, toastError])

  const cancelTransfer = useCallback((transferId: string): void => {
    // Notify peer if we're the sender waiting
    const resolver = pendingSends.current.get(transferId)
    if (resolver) { pendingSends.current.delete(transferId) }

    const transfer = useStore.getState().transfers.get(transferId)
    if (transfer) {
      const dc = activeDCs.current.get(transfer.peerId)
      if (dc?.readyState === 'open') {
        try { dc.send(JSON.stringify({ type: 'cancel', transferId } satisfies DataChannelControl)) } catch { /* ignore */ }
      }
    }
    updateTransfer(transferId, { status: 'cancelled' })
    setTimeout(() => removeTransfer(transferId), 500)
  }, [updateTransfer, removeTransfer])

  const onAcceptReceive = useCallback((transferId: string): void => {
    const transfer = useStore.getState().transfers.get(transferId)
    if (!transfer) return
    const dc = activeDCs.current.get(transfer.peerId)
    if (dc?.readyState === 'open') {
      try { dc.send(JSON.stringify({ type: 'accepted', transferId } satisfies DataChannelControl)) } catch { /* ignore */ }
    }
    updateTransfer(transferId, { status: 'transferring' })
  }, [updateTransfer])

  const onDeclineReceive = useCallback((transferId: string): void => {
    const transfer = useStore.getState().transfers.get(transferId)
    if (!transfer) return
    const dc = activeDCs.current.get(transfer.peerId)
    if (dc?.readyState === 'open') {
      try { dc.send(JSON.stringify({ type: 'declined', transferId } satisfies DataChannelControl)) } catch { /* ignore */ }
    }
    updateTransfer(transferId, { status: 'declined' })
    setTimeout(() => removeTransfer(transferId), 500)
  }, [updateTransfer, removeTransfer])

  const handleDataChannel = useCallback((peerId: string, dc: RTCDataChannel): void => {
    activeDCs.current.set(peerId, dc)

    dc.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
      if (typeof event.data === 'string') {
        let parsed: DataChannelMessage
        try { parsed = JSON.parse(event.data) as DataChannelMessage }
        catch { return }

        if (parsed.type === 'metadata') {
          const meta = parsed as TransferMetadata
          const peers = useStore.getState().peers
          const peer = peers.get(peerId)

          if (meta.transferType !== 'file') {
            // Text/link — instant, no accept needed
            const transferId = meta.transferId
            addTransfer({
              id: transferId, peerId,
              peerName: peer?.deviceName ?? 'Unknown',
              peerEmoji: peer?.deviceEmoji ?? '📱',
              direction: 'receive', type: meta.transferType,
              filename: meta.filename, mimeType: meta.mimeType,
              size: meta.size, totalChunks: 0,
              progress: 100, speed: 0, eta: 0, status: 'complete', content: meta.content,
            })
            addHistoryEntry({ id: transferId, direction: 'receive', type: meta.transferType, filename: meta.filename, size: meta.size, speed: 0, completedAt: new Date(), content: meta.content })
            toastInfo(`${peer?.deviceEmoji ?? ''} ${peer?.deviceName ?? 'Someone'} sent a ${meta.transferType}`)
            setTimeout(() => removeTransfer(transferId), 5000)
            return
          }

          // File — show accept/decline toast, don't send accepted yet
          const reassembler = new Reassembler(meta)
          reassemblers.current.set(meta.transferId, reassembler)

          const transfer: Transfer = {
            id: meta.transferId, peerId,
            peerName: peer?.deviceName ?? 'Unknown',
            peerEmoji: peer?.deviceEmoji ?? '📱',
            direction: 'receive', type: 'file',
            filename: meta.filename, mimeType: meta.mimeType,
            size: meta.size, totalChunks: meta.totalChunks,
            progress: 0, speed: 0, eta: 0, status: 'pending',
          }
          addTransfer(transfer)
          onReceiveRequest(transfer)

        } else if (parsed.type === 'accepted' || parsed.type === 'declined') {
          const ctrl = parsed as DataChannelControl
          const resolve = pendingSends.current.get(ctrl.transferId)
          if (resolve) {
            pendingSends.current.delete(ctrl.transferId)
            resolve(parsed.type === 'accepted')
          }
        } else if (parsed.type === 'cancel') {
          const ctrl = parsed as DataChannelControl
          updateTransfer(ctrl.transferId, { status: 'cancelled' })
          setTimeout(() => removeTransfer(ctrl.transferId), 500)
        }

      } else {
        // Binary chunk
        try {
          const { index, data } = extractChunkData(event.data as ArrayBuffer)
          for (const [transferId, reassembler] of reassemblers.current) {
            const complete = reassembler.addChunk(index, data)
            const progress = reassembler.progress() * 100
            const speed = trackSpeed(transferId, data.byteLength)
            const meta = reassembler.metadata
            const eta = (meta.size - (progress / 100) * meta.size) / (speed || 1)
            updateTransfer(transferId, { progress, speed, eta })

            if (complete) {
              const blob = reassembler.assemble()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = meta.filename; a.click()
              finishTransfer(transferId, url)
            }
            break
          }
        } catch { /* malformed chunk */ }
      }
    }

    dc.onclose = () => { activeDCs.current.delete(peerId) }
    dc.onerror = () => { activeDCs.current.delete(peerId) }
  }, [addTransfer, updateTransfer, removeTransfer, addHistoryEntry, onReceiveRequest, trackSpeed, finishTransfer, toastInfo])

  return { sendFile, sendFiles, sendText, cancelTransfer, handleDataChannel, onAcceptReceive, onDeclineReceive }
}
