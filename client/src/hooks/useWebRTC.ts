import { useRef, useCallback, useEffect } from 'react'
import type { SignalMessage } from '../lib/types.ts'
import { apiUrl } from '../lib/api.ts'

type SendSignalFn = (msg: SignalMessage) => void
type DataChannelHandler = (peerId: string, dc: RTCDataChannel) => void

export interface WebRTCControls {
  initiateOffer: (peerId: string) => Promise<void>
  handleOffer: (from: string, sdp: RTCSessionDescriptionInit) => Promise<void>
  handleAnswer: (from: string, sdp: RTCSessionDescriptionInit) => Promise<void>
  handleIceCandidate: (from: string, candidate: RTCIceCandidateInit) => Promise<void>
  getDataChannel: (peerId: string) => RTCDataChannel | undefined
  closeConnection: (peerId: string) => void
  closeAll: () => void
}

export function useWebRTC(
  myPeerId: string | undefined,
  sendSignal: SendSignalFn,
  onDataChannel: DataChannelHandler,
  onConnectionFailed?: (peerId: string) => void
): WebRTCControls {
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map())
  const dcs = useRef<Map<string, RTCDataChannel>>(new Map())
  const iceServers = useRef<RTCIceServer[]>([{ urls: 'stun:stun.l.google.com:19302' }])
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())

  // Keep refs always current so async callbacks don't go stale
  const sendSignalRef = useRef(sendSignal)
  sendSignalRef.current = sendSignal
  const onDataChannelRef = useRef(onDataChannel)
  onDataChannelRef.current = onDataChannel
  const myPeerIdRef = useRef(myPeerId)
  myPeerIdRef.current = myPeerId
  const onConnectionFailedRef = useRef(onConnectionFailed)
  onConnectionFailedRef.current = onConnectionFailed

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(apiUrl('/api/turn-creds'), { signal: ctrl.signal })
      .then(r => r.json())
      .then((servers: RTCIceServer[]) => { iceServers.current = servers })
      .catch(() => { /* keep STUN-only fallback */ })
    return () => ctrl.abort()
  }, [])

  const setupPC = useCallback((peerId: string, pc: RTCPeerConnection): void => {
    pc.onicecandidate = ({ candidate }) => {
      const from = myPeerIdRef.current
      if (candidate && from) {
        sendSignalRef.current({ type: 'ice', to: peerId, from, candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        onConnectionFailedRef.current?.(peerId)
      }
    }

    pc.ondatachannel = (event) => {
      const dc = event.channel
      dcs.current.set(peerId, dc)
      onDataChannelRef.current(peerId, dc)
    }
  }, [])

  const createPC = useCallback((peerId: string): RTCPeerConnection => {
    const existing = pcs.current.get(peerId)
    if (existing && existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
      return existing
    }
    const pc = new RTCPeerConnection({ iceServers: iceServers.current })
    pcs.current.set(peerId, pc)
    setupPC(peerId, pc)
    return pc
  }, [setupPC])

  const flushPendingCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection): Promise<void> => {
    const pending = pendingCandidates.current.get(peerId) ?? []
    for (const c of pending) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => { /* stale */ })
    }
    pendingCandidates.current.delete(peerId)
  }, [])

  const initiateOffer = useCallback(async (peerId: string): Promise<void> => {
    const from = myPeerIdRef.current
    if (!from) return
    const existingDC = dcs.current.get(peerId)
    if (existingDC && (existingDC.readyState === 'open' || existingDC.readyState === 'connecting')) return
    const pc = createPC(peerId)
    const dc = pc.createDataChannel('sendnow', { ordered: true })
    dcs.current.set(peerId, dc)
    onDataChannelRef.current(peerId, dc)

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendSignalRef.current({ type: 'offer', to: peerId, from, sdp: offer })
  }, [createPC])

  const handleOffer = useCallback(async (from: string, sdp: RTCSessionDescriptionInit): Promise<void> => {
    const myId = myPeerIdRef.current
    if (!myId) return
    const pc = createPC(from)
    await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    await flushPendingCandidates(from, pc)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    sendSignalRef.current({ type: 'answer', to: from, from: myId, sdp: answer })
  }, [createPC, flushPendingCandidates])

  const handleAnswer = useCallback(async (from: string, sdp: RTCSessionDescriptionInit): Promise<void> => {
    const pc = pcs.current.get(from)
    if (!pc) return
    await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    await flushPendingCandidates(from, pc)
  }, [flushPendingCandidates])

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit): Promise<void> => {
    const pc = pcs.current.get(from)
    if (!pc || !pc.remoteDescription) {
      const q = pendingCandidates.current.get(from) ?? []
      q.push(candidate)
      pendingCandidates.current.set(from, q)
      return
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { /* stale */ })
  }, [])

  const getDataChannel = useCallback((peerId: string): RTCDataChannel | undefined => {
    return dcs.current.get(peerId)
  }, [])

  const closeConnection = useCallback((peerId: string): void => {
    dcs.current.get(peerId)?.close()
    dcs.current.delete(peerId)
    pcs.current.get(peerId)?.close()
    pcs.current.delete(peerId)
  }, [])

  const closeAll = useCallback((): void => {
    for (const dc of dcs.current.values()) dc.close()
    for (const pc of pcs.current.values()) pc.close()
    dcs.current.clear()
    pcs.current.clear()
  }, [])

  useEffect(() => {
    return () => {
      for (const dc of dcs.current.values()) dc.close()
      for (const pc of pcs.current.values()) pc.close()
    }
  }, [])

  return { initiateOffer, handleOffer, handleAnswer, handleIceCandidate, getDataChannel, closeConnection, closeAll }
}
