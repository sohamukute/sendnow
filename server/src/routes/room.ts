import { Hono } from 'hono'
import { createNewRoom, checkRoom } from '../services/rooms.ts'
import { logger } from '../lib/logger.ts'

const ROOM_CODE_RE = /^[A-Z2-9]{4}$/
const createCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = createCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    createCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const room = new Hono()

room.post('/', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Too many requests' }, 429)
  }
  let roomType: 'p2p' | 'broadcast' = 'p2p'
  try {
    const body = await c.req.json<{ type?: string }>()
    if (body.type === 'broadcast') roomType = 'broadcast'
  } catch { /* default p2p */ }
  const hostId = crypto.randomUUID()
  try {
    const code = await createNewRoom(hostId, roomType)
    logger.info('room', 'created', { code })
    return c.json({ code })
  } catch (err) {
    logger.error('room', 'create failed', { error: String(err) })
    return c.json({ error: 'Failed to create room' }, 500)
  }
})

room.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()
  if (!ROOM_CODE_RE.test(code)) {
    return c.json({ exists: false }, 400)
  }
  const result = await checkRoom(code)
  return c.json(result)
})

export default room
