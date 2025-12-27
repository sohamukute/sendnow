import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, RotateCcw, XCircle, Ban, ArrowRight, ArrowLeft } from 'lucide-react'
import type { Transfer } from '../lib/types.ts'
import { formatBytes, formatSpeed, formatETA } from '../lib/deviceInfo.ts'
import { FileTypeIcon } from './FileTypeIcon.tsx'

interface Props {
  transfer: Transfer
  onCancel: (id: string) => void
  onRetry?: (id: string) => void
}

export function TransferCard({ transfer, onCancel, onRetry }: Props) {
  const { id, filename, size, progress, speed, eta, status, direction, type, peerName, content } = transfer

  const isComplete = status === 'complete'
  const isError = status === 'error'
  const isCancelled = status === 'cancelled' || status === 'declined'
  const isActive = status === 'transferring' || status === 'pending'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-card border border-border rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {isComplete
              ? <CheckCircle className="w-6 h-6 text-green-500" />
              : isError
                ? <XCircle className="w-6 h-6 text-destructive" />
                : isCancelled
                  ? <Ban className="w-6 h-6 text-muted-foreground" />
                  : <FileTypeIcon mimeType={transfer.mimeType} className="w-6 h-6 text-muted-foreground" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {type === 'text' ? 'Note' : type === 'link' ? 'Link' : filename}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {direction === 'send'
                    ? <><ArrowRight className="w-3 h-3 inline" /> {peerName}</>
                    : <><ArrowLeft className="w-3 h-3 inline" /> {peerName}</>
                  }
                  {size > 0 && <span>· {formatBytes(size)}</span>}
                </p>
              </div>

              {(isActive || isError) && (
                <button
                  onClick={() => onCancel(id)}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Cancel transfer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {isError && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  {onRetry && (
                    <button
                      onClick={() => onRetry(id)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Retry"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {(type === 'text' || type === 'link') && content && (
              <div className="mt-2 p-2 rounded-lg bg-muted text-xs text-foreground max-h-20 overflow-hidden">
                {type === 'link' ? (
                  <a href={content} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                    {content}
                  </a>
                ) : (
                  <span className="break-words">{content.slice(0, 200)}</span>
                )}
              </div>
            )}

            {type === 'file' && (
              <div className="mt-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'linear', duration: 0.1 }}
                  />
                </div>

                {isActive && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {speed > 0 ? formatSpeed(speed) : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {progress >= 99 ? 'Finishing…' : eta > 0 ? formatETA(eta) : `${Math.round(progress)}%`}
                    </span>
                  </div>
                )}

                {isComplete && <p className="text-xs text-green-600 mt-1 font-medium">Transfer complete</p>}
                {isError && <p className="text-xs text-destructive mt-1">Transfer failed</p>}
                {isCancelled && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {status === 'declined' ? 'Declined by recipient' : 'Cancelled'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
