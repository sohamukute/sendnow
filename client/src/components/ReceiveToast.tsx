import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Transfer } from '../lib/types.ts'
import { formatBytes } from '../lib/deviceInfo.ts'

interface Props {
  transfer: Transfer
  onAccept: (transferId: string) => void
  onDecline: (transferId: string) => void
}

const TIMEOUT_SECS = 30

export function ReceiveToast({ transfer, onAccept, onDecline }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECS)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          onDecline(transfer.id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [transfer.id, onDecline])

  const circumference = 2 * Math.PI * 10 // r=10
  const dashOffset = circumference * (1 - secondsLeft / TIMEOUT_SECS)

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="bg-card border border-border rounded-xl shadow-lg p-4 w-72 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{transfer.peerEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">
            <span className="font-medium">{transfer.peerName}</span> wants to send{' '}
            <span className="font-semibold truncate">{transfer.filename}</span>
          </p>
          {transfer.size > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(transfer.size)}</p>
          )}
        </div>

        {/* Countdown ring */}
        <div className="flex-shrink-0 relative w-7 h-7">
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle
              cx="12" cy="12" r="10"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-muted-foreground">
            {secondsLeft}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAccept(transfer.id)}
          className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Accept
        </button>
        <button
          onClick={() => onDecline(transfer.id)}
          className="flex-1 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 transition-colors"
        >
          Decline
        </button>
      </div>
    </motion.div>
  )
}
