import { motion, AnimatePresence } from 'framer-motion'
import type { Peer } from '../lib/types.ts'
import { DeviceIcon } from './DeviceIcon.tsx'

interface Props {
  peer: Peer
  selected: boolean
  sending: boolean
  onClick: () => void
}

export function DeviceBubble({ peer, selected, sending, onClick }: Props) {
  return (
    <AnimatePresence>
      <motion.button
        key={peer.peerId}
        initial={{ opacity: 0, y: 30, scale: 0.85 }}
        animate={{ opacity: peer.connected ? 1 : 0.45, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        whileHover={peer.connected ? { scale: 1.04, y: -2 } : {}}
        whileTap={peer.connected ? { scale: 0.97 } : {}}
        onClick={onClick}
        disabled={!peer.connected}
        className="relative flex flex-col items-center gap-2.5 focus:outline-none group"
        aria-label={`Send to ${peer.deviceName}`}
      >
        {/* Sending pulse */}
        {sending && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0, 0.9] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-primary/50"
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}

        {/* Selection ring */}
        {selected && !sending && (
          <motion.div
            layoutId="selection-ring"
            className="absolute inset-[-5px] rounded-full border-2 border-primary"
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          />
        )}

        {/* Bubble */}
        <div
          className={`
            relative w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] rounded-full flex items-center justify-center
            transition-all duration-200
            ${selected
              ? 'bg-primary/10 border-2 border-primary/30'
              : 'bg-secondary border border-border group-hover:border-primary/30 group-hover:bg-secondary/80'
            }
          `}
          style={selected || sending
            ? { boxShadow: `0 0 0 4px var(--shadow-color, var(--primary)) / 0.15, 0 8px 24px oklch(0.58 0.22 215 / 0.20)` }
            : undefined
          }
        >
          <DeviceIcon
            type={peer.deviceType}
            className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${selected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'}`}
          />

          {/* Online indicator */}
          {peer.connected && (
            <span className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
          )}
        </div>

        {/* Name */}
        <span
          className={`
            text-xs font-medium text-center max-w-[110px] truncate leading-tight
            ${!peer.connected ? 'line-through text-muted-foreground' : selected ? 'text-primary' : 'text-foreground'}
          `}
        >
          {peer.deviceName}
        </span>
      </motion.button>
    </AnimatePresence>
  )
}
