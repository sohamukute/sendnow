import { motion, AnimatePresence } from 'framer-motion'
import type { Peer } from '../lib/types.ts'

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
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={{ opacity: peer.connected ? 1 : 0.4, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        whileHover={peer.connected ? { scale: 1.05 } : {}}
        onClick={onClick}
        disabled={!peer.connected}
        className="relative flex flex-col items-center gap-2 focus:outline-none group"
        aria-label={`Send to ${peer.deviceName}`}
      >
        {/* Sending pulse ring */}
        {sending && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Selected ring */}
        {selected && !sending && (
          <motion.div
            layoutId="selection-ring"
            className="absolute inset-[-4px] rounded-full border-2 border-primary"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        {/* Bubble */}
        <div
          className={`
            relative w-[120px] h-[120px] max-sm:w-[80px] max-sm:h-[80px] rounded-full
            bg-secondary flex items-center justify-center
            transition-shadow duration-200
            ${selected ? 'shadow-lg' : 'shadow-sm'}
            ${peer.connected ? 'group-hover:shadow-md' : ''}
          `}
          style={selected || sending ? { boxShadow: `0 0 0 3px var(--shadow-color)` } : undefined}
        >
          <span className="text-[2rem] max-sm:text-[1.4rem] select-none" aria-hidden>
            {peer.deviceEmoji}
          </span>

          {/* Device type badge */}
          <span className="absolute bottom-1 right-1 text-[0.6rem] bg-background rounded-full px-1 py-0.5 shadow-sm select-none">
            {getOSIcon(peer.deviceType)}
          </span>
        </div>

        {/* Device name */}
        <span
          className={`
            text-xs font-medium text-center max-w-[120px] max-sm:max-w-[80px] truncate
            ${!peer.connected ? 'line-through text-muted-foreground' : 'text-foreground'}
          `}
        >
          {peer.deviceName}
        </span>
      </motion.button>
    </AnimatePresence>
  )
}

function getOSIcon(deviceType: string): string {
  const map: Record<string, string> = { mobile: '📱', tablet: '📟', laptop: '💻', desktop: '🖥️' }
  return map[deviceType] ?? '💻'
}
