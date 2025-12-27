import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, SearchX } from 'lucide-react'
import { Home } from './Home.tsx'
import { apiUrl } from '../lib/api.ts'

export function Join() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'joining' | 'notfound' | 'ready'>('checking')

  useEffect(() => {
    if (!code) { navigate('/'); return }

    const ctrl = new AbortController()
    setStatus('checking')

    fetch(apiUrl(`/api/room/${code.toUpperCase()}`), { signal: ctrl.signal })
      .then(r => r.json())
      .then((data: { exists: boolean }) => {
        if (!data.exists) {
          setStatus('notfound')
          setTimeout(() => navigate('/'), 3000)
        } else {
          setStatus('ready')
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== 'AbortError') {
          setStatus('notfound')
          setTimeout(() => navigate('/'), 3000)
        }
      })

    return () => ctrl.abort()
  }, [code, navigate])

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to room…</p>
        </div>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <SearchX className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Room not found</h1>
          <p className="text-sm text-muted-foreground">
            Room <span className="font-mono font-bold text-primary">{code?.toUpperCase()}</span> has expired or doesn't exist.
          </p>
          <p className="text-xs text-muted-foreground">Redirecting home in 3 seconds…</p>
        </motion.div>
      </div>
    )
  }

  return <Home initialRoomCode={code?.toUpperCase()} />
}
