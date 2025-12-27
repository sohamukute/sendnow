import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Share2, X, Check, Clock, AlertTriangle } from 'lucide-react'

interface Props {
  code: string
  onClose: () => void
}

const ROOM_TTL = 30 * 60

function getAppUrl(): string {
  // In production use the canonical URL if set; otherwise use current origin.
  // In dev (localhost) warn user the link won't work outside this machine.
  const envUrl = import.meta.env['VITE_APP_URL'] as string | undefined
  return (envUrl ?? window.location.origin).replace(/\/$/, '')
}

export function ShareModal({ code, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(ROOM_TTL)

  const appUrl = getAppUrl()
  const joinUrl = `${appUrl}/join/${code}`
  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1')

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [joinUrl])

  const handleShare = useCallback(async () => {
    if (!navigator.share) return
    await navigator.share({ title: 'Join me on SendNow', url: joinUrl }).catch(() => { /* cancelled */ })
  }, [joinUrl])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-card border border-border rounded-2xl shadow-lg p-6 max-w-sm w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-base font-semibold text-foreground mb-0.5">Invite via link</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Share this with someone not on your network — expires in{' '}
            <span className="font-mono font-semibold text-primary">{timeStr}</span>
          </p>

          {/* Dev warning */}
          {isLocalhost && (
            <div className="mb-4 flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Running locally — this link only works on your machine. Deploy to share with others.</span>
            </div>
          )}

          <div className="flex gap-5 items-start">
            {/* QR */}
            <div className="flex-shrink-0 p-3 bg-white rounded-xl border border-border">
              <QRCodeSVG value={joinUrl} size={140} />
            </div>

            {/* Code + actions */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Room code</p>
                <p className="font-mono text-3xl font-bold tracking-widest text-primary">{code}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Expires in {timeStr}</span>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>

              {typeof navigator.share === 'function' && (
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share…
                </button>
              )}

              <p className="text-[10px] text-muted-foreground break-all leading-relaxed">{joinUrl}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
