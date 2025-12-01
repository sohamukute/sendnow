import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/index.ts'
import { DeviceBubble } from '../components/DeviceBubble.tsx'
import { DropZone } from '../components/DropZone.tsx'
import { TransferCard } from '../components/TransferCard.tsx'
import { ShareModal } from '../components/ShareModal.tsx'
import { ReceiveToast } from '../components/ReceiveToast.tsx'
import { SessionHistory } from '../components/SessionHistory.tsx'
import { useDevice } from '../hooks/useDevice.ts'
import { useSignaling } from '../hooks/useSignaling.ts'
import { useWebRTC } from '../hooks/useWebRTC.ts'
import { useTransfer } from '../hooks/useTransfer.ts'
import type { SignalMessage, Transfer } from '../lib/types.ts'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export function Home({ initialRoomCode }: { initialRoomCode?: string }) {
  const device = useDevice()
  const {
    peers, selectedPeerId, selectPeer, transfers, history, wsStatus, setRoomCode, roomCode,
  } = useStore()

  const [shareModalCode, setShareModalCode] = useState<string | null>(null)
  const [pendingReceives, setPendingReceives] = useState<Transfer[]>([])
  const [infoToast, setInfoToast] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  // Stable sendSignal proxy — populated after useSignaling initialises
  const sendSignalRef = useRef<(msg: SignalMessage) => void>(() => { /* not yet connected */ })
  const sendSignalStable = useCallback((msg: SignalMessage) => sendSignalRef.current(msg), [])

  const toastError = useCallback((msg: string) => {
    setErrorToast(msg)
    setTimeout(() => setErrorToast(null), 4000)
  }, [])

  const toastInfo = useCallback((msg: string) => {
    setInfoToast(msg)
    setTimeout(() => setInfoToast(null), 3000)
  }, [])

  const onReceiveRequest = useCallback((transfer: Transfer) => {
    setPendingReceives((prev) => [...prev, transfer])
  }, [])

  const { sendFiles, sendText, cancelTransfer, handleDataChannel, onAcceptReceive, onDeclineReceive } =
    useTransfer(onReceiveRequest, toastError, toastInfo)

  const onDataChannel = useCallback((peerId: string, dc: RTCDataChannel) => {
    handleDataChannel(peerId, dc)
  }, [handleDataChannel])

  const onConnectionFailed = useCallback((peerId: string) => {
    const peer = useStore.getState().peers.get(peerId)
    toastInfo(`Direct connection failed${peer ? ` to ${peer.deviceName}` : ''} — trying relay…`)
  }, [toastInfo])

  const { initiateOffer, handleOffer, handleAnswer, handleIceCandidate, closeAll } = useWebRTC(
    device?.peerId,
    sendSignalStable,
    onDataChannel,
    onConnectionFailed
  )

  // These need to be in refs so onSignalMessage closure stays current
  const initiateOfferRef = useRef(initiateOffer)
  initiateOfferRef.current = initiateOffer
  const handleOfferRef = useRef(handleOffer)
  handleOfferRef.current = handleOffer
  const handleAnswerRef = useRef(handleAnswer)
  handleAnswerRef.current = handleAnswer
  const handleIceCandidateRef = useRef(handleIceCandidate)
  handleIceCandidateRef.current = handleIceCandidate
  const deviceRef = useRef(device)
  deviceRef.current = device

  const onSignalMessage = useCallback((msg: SignalMessage) => {
    switch (msg.type) {
      case 'peer_joined': {
        const myId = deviceRef.current?.peerId
        // Lower peerId initiates offer — avoids glare
        if (myId && myId < msg.peerId) {
          void initiateOfferRef.current(msg.peerId)
        }
        break
      }
      case 'offer':
        void handleOfferRef.current(msg.from, msg.sdp)
        break
      case 'answer':
        void handleAnswerRef.current(msg.from, msg.sdp)
        break
      case 'ice':
        void handleIceCandidateRef.current(msg.from, msg.candidate)
        break
      default:
        break
    }
  }, [])

  const { sendSignal } = useSignaling(device, onSignalMessage, initialRoomCode)

  // Keep the proxy ref up to date
  useEffect(() => { sendSignalRef.current = sendSignal }, [sendSignal])

  useEffect(() => () => closeAll(), [closeAll])

  // Global paste → send to selected peer
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!selectedPeerId) return
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length > 0) { sendFiles(selectedPeerId, files); return }
      const text = e.clipboardData?.getData('text')
      if (text) sendText(selectedPeerId, text)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [selectedPeerId, sendFiles, sendText])

  const createRoom = useCallback(async (type: 'p2p' | 'broadcast'): Promise<string> => {
    const res = await fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    const data = await res.json() as { code: string }
    setRoomCode(data.code)
    return data.code
  }, [setRoomCode])

  const handleBroadcast = useCallback(async () => {
    const code = await createRoom('broadcast')
    setShareModalCode(code)
  }, [createRoom])

  const handleShareOutside = useCallback(async () => {
    if (roomCode) { setShareModalCode(roomCode); return }
    const code = await createRoom('p2p')
    setShareModalCode(code)
  }, [roomCode, createRoom])

  const handleAcceptReceive = useCallback((transferId: string) => {
    setPendingReceives((prev) => prev.filter((t) => t.id !== transferId))
    onAcceptReceive(transferId)
  }, [onAcceptReceive])

  const handleDeclineReceive = useCallback((transferId: string) => {
    setPendingReceives((prev) => prev.filter((t) => t.id !== transferId))
    onDeclineReceive(transferId)
  }, [onDeclineReceive])

  const peerList = Array.from(peers.values())
  const transferList = Array.from(transfers.values())
  const activePeer = selectedPeerId ? peers.get(selectedPeerId) : undefined
  const sendingPeerIds = new Set(
    transferList.filter(t => t.direction === 'send' && t.status === 'transferring').map(t => t.peerId)
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-xl font-bold text-foreground tracking-tight">⚡ SendNow</span>
        <div className="flex items-center gap-3">
          {wsStatus === 'connected' && <Wifi className="w-4 h-4 text-green-500" />}
          {wsStatus === 'connecting' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {wsStatus === 'reconnecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full"
            >
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              <span className="text-[10px] text-amber-700 font-medium">Reconnecting…</span>
            </motion.div>
          )}
          {wsStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-destructive" />}
          {device && (
            <span className="text-sm text-muted-foreground">
              {device.deviceEmoji} {device.deviceName}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — nearby devices */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
              Nearby devices
            </h2>

            {peerList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-5">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.9 }}
                  />
                  <span className="text-3xl">📡</span>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-[200px] leading-relaxed">
                  Open SendNow on another device to connect
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 sm:gap-8">
                <AnimatePresence>
                  {peerList.map((peer) => (
                    <DeviceBubble
                      key={peer.peerId}
                      peer={peer}
                      selected={selectedPeerId === peer.peerId}
                      sending={sendingPeerIds.has(peer.peerId)}
                      onClick={() => selectPeer(selectedPeerId === peer.peerId ? null : peer.peerId)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Right — drop zone + history */}
          <div className="flex flex-col gap-6">
            <DropZone
              selectedPeerId={selectedPeerId}
              selectedPeerName={activePeer?.deviceName}
              onFiles={(files) => { if (selectedPeerId) sendFiles(selectedPeerId, files) }}
              onText={(text) => { if (selectedPeerId) sendText(selectedPeerId, text) }}
              onBroadcast={handleBroadcast}
              onShareOutside={handleShareOutside}
            />

            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {transferList.map((transfer) => (
                  <TransferCard
                    key={transfer.id}
                    transfer={transfer}
                    onCancel={cancelTransfer}
                  />
                ))}
              </AnimatePresence>
            </div>

            <SessionHistory history={history} />
          </div>
        </div>
      </main>

      {/* Share modal */}
      {shareModalCode && (
        <ShareModal code={shareModalCode} onClose={() => setShareModalCode(null)} />
      )}

      {/* Top-right toast stack */}
      <div className="fixed top-4 right-4 z-40 flex flex-col gap-3 max-w-[300px]">
        <AnimatePresence>
          {pendingReceives.map((transfer) => (
            <ReceiveToast
              key={transfer.id}
              transfer={transfer}
              onAccept={handleAcceptReceive}
              onDecline={handleDeclineReceive}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {infoToast && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-card border border-border rounded-xl shadow-sm px-4 py-3 text-sm text-foreground"
            >
              {infoToast}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {errorToast && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl shadow-sm px-4 py-3 text-sm text-destructive"
            >
              {errorToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
