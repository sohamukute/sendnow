import { useRef, useState, useCallback, type DragEvent, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Upload, Send, Link } from 'lucide-react'
import { isURL } from '../lib/deviceInfo.ts'

interface Props {
  selectedPeerId: string | null
  selectedPeerName: string | undefined
  onFiles: (files: File[]) => void
  onText: (text: string) => void
  onBroadcast: () => void
  onShareOutside: () => void
}

export function DropZone({ selectedPeerId, selectedPeerName, onFiles, onText, onBroadcast, onShareOutside }: Props) {
  const [dragging, setDragging] = useState(false)
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFiles(files)
  }, [onFiles])

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current++
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || !selectedPeerId) return
    onText(trimmed)
    setText('')
  }, [text, selectedPeerId, onText])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const isLink = isURL(text.trim())

  return (
    <div className="flex flex-col gap-4">
      {/* Drop area */}
      <motion.div
        animate={dragging ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors duration-200 min-h-[160px] flex flex-col items-center justify-center gap-3
          ${dragging
            ? 'border-primary bg-primary/10'
            : selectedPeerId
              ? 'border-border hover:border-primary/60 hover:bg-muted/50'
              : 'border-border opacity-60 cursor-default'
          }
        `}
      >
        <motion.div
          animate={dragging ? { y: -4 } : { y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
        </motion.div>
        {selectedPeerId ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop files for <span className="text-primary">{selectedPeerName}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse · max 100MB per file</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a device first</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) onFiles(files)
            e.target.value = ''
          }}
        />
      </motion.div>

      {/* Text / link input */}
      <div className="relative">
        <div className="flex items-start gap-1 rounded-xl border border-border bg-card focus-within:border-primary/60 transition-colors">
          <div className="pt-3 pl-3 text-muted-foreground">
            {isLink ? <Link className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedPeerId ? 'Paste text, link, or note… (Ctrl+Enter to send)' : 'Select a device to send text'}
            disabled={!selectedPeerId}
            rows={3}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none py-3 pr-3 focus:outline-none disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || !selectedPeerId}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          <Send className="w-4 h-4" />
          {isLink ? 'Send Link' : 'Send Note'}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onBroadcast}
          className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          📡 Broadcast
        </button>
        <button
          onClick={onShareOutside}
          className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          🔗 Share outside WiFi
        </button>
      </div>
    </div>
  )
}
