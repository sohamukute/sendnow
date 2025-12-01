import { Hono } from 'hono'
import { logger } from '../lib/logger.ts'

const turn = new Hono()

turn.get('/', async (c) => {
  const apiKey = process.env['METERED_API_KEY']!
  const domain = process.env['METERED_DOMAIN']!

  try {
    const res = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`)
    if (!res.ok) throw new Error(`Metered returned ${res.status}`)
    const iceServers = await res.json()
    return c.json([{ urls: 'stun:stun.l.google.com:19302' }, ...(iceServers as unknown[])])
  } catch (err) {
    logger.error('turn', 'fetch credentials failed', { error: String(err) })
    // Fallback: return only Google STUN
    return c.json([{ urls: 'stun:stun.l.google.com:19302' }])
  }
})

export default turn
