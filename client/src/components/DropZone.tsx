import { useRef, useState, useCallback, type DragEvent, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Upload, Send, Link, Radio, Share2, Info } from 'lucide-react'
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
        onClick={() => selectedPeerId && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center
          transition-all duration-200 min-h-[160px] flex flex-col items-center justify-center gap-3
          ${dragging
            ? 'border-primary bg-primary/8 scale-[1.01]'
            : selectedPeerId
              ? 'border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer'
              : 'border-border opacity-50 cursor-not-allowed'
          }
        `}
      >
        <motion.div
          animate={dragging ? { y: -6, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${dragging ? 'bg-primary/20' : 'bg-muted'}`}
        >
          <Upload className={`w-5 h-5 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </motion.div>

        {selectedPeerId ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop files for <span className="text-primary font-semibold">{selectedPeerName}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse · any size</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground">Select a device first</p>
            <p className="text-xs text-muted-foreground mt-1">Click a device on the left to start</p>
          </div>
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
      <div>
        <div className="flex items-start gap-1 rounded-xl border border-border bg-card focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <div className="pt-3.5 pl-3.5 text-muted-foreground">
            {isLink ? <Link className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedPeerId ? 'Paste text, link, or note… (Ctrl+Enter to send)' : 'Select a device to send text'}
            disabled={!selectedPeerId}
            rows={3}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 resize-none py-3.5 pr-3.5 focus:outline-none disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || !selectedPeerId}
          className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          <Send className="w-4 h-4" />
          {isLink ? 'Send Link' : 'Send Note'}
        </button>
      </div>

      {/* Action buttons with explanations */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Broadcast */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onBroadcast}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all"
          >
            <Radio className="w-4 h-4 text-primary" />
            Broadcast
          </button>
          <p className="text-[11px] text-muted-foreground text-center leading-tight px-1 flex items-start gap-1 justify-center">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Sends to <em>all</em> nearby devices at once
          </p>
        </div>

        {/* Invite via link */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onShareOutside}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all"
          >
            <Share2 className="w-4 h-4 text-primary" />
            Invite via link
          </button>
          <p className="text-[11px] text-muted-foreground text-center leading-tight px-1 flex items-start gap-1 justify-center">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            For someone <em>not</em> on your network
          </p>
        </div>
      </div>
    </div>
  )
}
