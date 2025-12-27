import { motion, AnimatePresence } from 'framer-motion'
import { Download, Clock, FileText, Link, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import type { HistoryEntry } from '../lib/types.ts'
import { formatBytes } from '../lib/deviceInfo.ts'

interface Props {
  history: HistoryEntry[]
}

export function SessionHistory({ history }: Props) {
  if (history.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Session history</h3>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {history.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <div className="flex-shrink-0 text-muted-foreground">
                {entry.type === 'text'
                  ? <FileText className="w-4 h-4" />
                  : entry.type === 'link'
                    ? <Link className="w-4 h-4" />
                    : entry.direction === 'receive'
                      ? <ArrowDownToLine className="w-4 h-4 text-primary" />
                      : <ArrowUpFromLine className="w-4 h-4 text-primary" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{entry.filename}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {entry.direction === 'send' ? 'Sent' : 'Received'}
                  </span>
                  {entry.size > 0 && (
                    <span className="text-[10px] text-muted-foreground">{formatBytes(entry.size)}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{formatTimeAgo(entry.completedAt)}</span>
                </div>

                {(entry.type === 'text' || entry.type === 'link') && entry.content && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{entry.content.slice(0, 60)}</p>
                )}
              </div>

              {entry.blobUrl && (
                <a
                  href={entry.blobUrl}
                  download={entry.filename}
                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  title="Download again"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}
