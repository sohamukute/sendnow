import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Share2, X, Check } from 'lucide-react'

interface Props {
  code: string
  onClose: () => void
}

const ROOM_TTL = 30 * 60 // 30 minutes in seconds

export function ShareModal({ code, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(ROOM_TTL)

  const appUrl = import.meta.env['VITE_APP_URL'] as string | undefined ?? window.location.origin
  const joinUrl = `${appUrl}/join/${code}`

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
    await navigator.share({ title: 'Join SendNow', url: joinUrl }).catch(() => { /* user cancelled */ })
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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

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

          <h2 className="text-base font-semibold text-foreground mb-1">Share outside WiFi</h2>
          <p className="text-xs text-muted-foreground mb-5">Scan QR or share the link — expires in <span className="font-mono font-medium text-primary">{timeStr}</span></p>

          <div className="flex gap-5 items-start">
            {/* QR code */}
            <div className="flex-shrink-0 p-3 bg-white rounded-xl">
              <QRCodeSVG value={joinUrl} size={156} />
            </div>

            {/* Code + actions */}
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Room code</p>
                <p className="font-mono text-3xl font-bold tracking-widest text-primary">{code}</p>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
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

              <p className="text-[10px] text-muted-foreground text-center break-all">{joinUrl}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
