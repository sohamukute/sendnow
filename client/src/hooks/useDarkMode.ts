import { useState, useEffect } from 'react'

const KEY = 'sendnow:theme'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem(KEY, isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  return { isDark, toggle: () => setIsDark((d) => !d) }
}
