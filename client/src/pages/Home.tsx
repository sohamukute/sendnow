import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/index.ts'
import { DeviceBubble } from '../components/DeviceBubble.tsx'
import { DropZone } from '../components/DropZone.tsx'
import { TransferCard } from '../components/TransferCard.tsx'
import { ShareModal } from '../components/ShareModal.tsx'
import { ReceiveToast } from '../components/ReceiveToast.tsx'
import { SessionHistory } from '../components/SessionHistory.tsx'
import { DeviceIcon } from '../components/DeviceIcon.tsx'
import { useDevice } from '../hooks/useDevice.ts'
import { useSignaling } from '../hooks/useSignaling.ts'
import { useWebRTC } from '../hooks/useWebRTC.ts'
import { useTransfer } from '../hooks/useTransfer.ts'
import { useDarkMode } from '../hooks/useDarkMode.ts'
import type { SignalMessage, Transfer } from '../lib/types.ts'
import { apiUrl } from '../lib/api.ts'
import { WifiOff, Loader2, Zap, Sun, Moon, Radio, ArrowRight } from 'lucide-react'

export function Home({ initialRoomCode }: { initialRoomCode?: string }) {
  const device = useDevice()
  const { isDark, toggle: toggleDark } = useDarkMode()
  const navigate = useNavigate()
  const {
    peers, selectedPeerId, selectPeer, transfers, history, wsStatus, setRoomCode, roomCode,
  } = useStore()

  const [shareModalCode, setShareModalCode] = useState<string | null>(null)
  const [pendingReceives, setPendingReceives] = useState<Transfer[]>([])
  const [infoToast, setInfoToast] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [joinInput, setJoinInput] = useState('')

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
    toastInfo(`Connection failed${peer ? ` to ${peer.deviceName}` : ''} — trying relay…`)
  }, [toastInfo])

  const { initiateOffer, handleOffer, handleAnswer, handleIceCandidate, closeAll } = useWebRTC(
    device?.peerId, sendSignalStable, onDataChannel, onConnectionFailed
  )

  const initiateOfferRef = useRef(initiateOffer); initiateOfferRef.current = initiateOffer
  const handleOfferRef = useRef(handleOffer); handleOfferRef.current = handleOffer
  const handleAnswerRef = useRef(handleAnswer); handleAnswerRef.current = handleAnswer
  const handleIceCandidateRef = useRef(handleIceCandidate); handleIceCandidateRef.current = handleIceCandidate
  const deviceRef = useRef(device); deviceRef.current = device

  const onSignalMessage = useCallback((msg: SignalMessage) => {
    switch (msg.type) {
      case 'peer_joined': {
        const myId = deviceRef.current?.peerId
        if (myId && myId < msg.peerId) void initiateOfferRef.current(msg.peerId)
        break
      }
      case 'offer': void handleOfferRef.current(msg.from, msg.sdp); break
      case 'answer': void handleAnswerRef.current(msg.from, msg.sdp); break
      case 'ice': void handleIceCandidateRef.current(msg.from, msg.candidate); break
      default: break
    }
  }, [])

  const { sendSignal } = useSignaling(device, onSignalMessage, initialRoomCode)

  useEffect(() => { sendSignalRef.current = sendSignal }, [sendSignal])
  useEffect(() => () => closeAll(), [closeAll])

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
    const res = await fetch(apiUrl('/api/room'), {
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

  const handleJoinCode = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const code = joinInput.trim().toUpperCase()
    if (code.length < 4) return
    navigate(`/join/${code}`)
  }, [joinInput, navigate])

  const peerList = Array.from(peers.values())
  const transferList = Array.from(transfers.values())
  const activePeer = selectedPeerId ? peers.get(selectedPeerId) : undefined
  const sendingPeerIds = new Set(
    transferList.filter(t => t.direction === 'send' && t.status === 'transferring').map(t => t.peerId)
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">SendNow</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection badge */}
          <div className="flex items-center gap-1.5">
            {wsStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Connected</span>
              </span>
            )}
            {wsStatus === 'connecting' && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Connecting…</span>
              </span>
            )}
            {wsStatus === 'reconnecting' && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                Reconnecting
              </span>
            )}
            {wsStatus === 'disconnected' && (
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>

          {/* Current device */}
          {device && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1 bg-muted/40">
              <DeviceIcon type={device.deviceType} className="w-3.5 h-3.5" />
              <span className="font-medium">{device.deviceName}</span>
            </div>
          )}

          {/* Dark toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-10 items-start">

          {/* ── Left: Devices + Join ─────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nearby devices
              </h2>
              {peerList.length > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {peerList.length} online
                </span>
              )}
            </div>

            {/* Device grid or scanning state */}
            <div className="min-h-[220px] flex items-center">
              {peerList.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center gap-4 py-8">
                  {/* Animated radar */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {[0, 0.8, 1.6].map((delay) => (
                      <motion.div
                        key={delay}
                        className="absolute inset-0 rounded-full border border-primary/40"
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay }}
                      />
                    ))}
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Radio className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Scanning for devices…</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Open SendNow on another device on the same network
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-wrap gap-5 sm:gap-6">
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

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                or join with a code
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ── Join code input ── */}
            <div>
              <p className="text-xs text-muted-foreground mb-2.5">
                Got a room code from someone? Enter it here to connect.
              </p>
              <form onSubmit={handleJoinCode} className="flex gap-2">
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="Enter code…"
                  maxLength={8}
                  spellCheck={false}
                  className="flex-1 font-mono text-sm uppercase bg-card border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all tracking-widest"
                />
                <button
                  type="submit"
                  disabled={joinInput.trim().length < 4}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Join
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* ── Right: Drop zone + Transfers + History ───────────── */}
          <div className="flex flex-col gap-5">
            <DropZone
              selectedPeerId={selectedPeerId}
              selectedPeerName={activePeer?.deviceName}
              onFiles={(files) => { if (selectedPeerId) sendFiles(selectedPeerId, files) }}
              onText={(text) => { if (selectedPeerId) sendText(selectedPeerId, text) }}
              onBroadcast={handleBroadcast}
              onShareOutside={handleShareOutside}
            />

            <AnimatePresence>
              {transferList.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  onCancel={cancelTransfer}
                />
              ))}
            </AnimatePresence>

            <SessionHistory history={history} />
          </div>
        </div>
      </main>

      {/* ── Share modal ───────────────────────────────────────────── */}
      {shareModalCode && (
        <ShareModal code={shareModalCode} onClose={() => setShareModalCode(null)} />
      )}

      {/* ── Toast stack ───────────────────────────────────────────── */}
      <div className="fixed top-[60px] right-4 z-40 flex flex-col gap-3 max-w-[300px]">
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
              initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-card border border-border rounded-xl shadow-md px-4 py-3 text-sm text-foreground"
            >
              {infoToast}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {errorToast && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl shadow-md px-4 py-3 text-sm text-destructive"
            >
              {errorToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
