import { Hono } from 'hono'
import { createNewRoom, checkRoom } from '../services/rooms.ts'
import { logger } from '../lib/logger.ts'

const room = new Hono()

room.post('/', async (c) => {
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
  const result = await checkRoom(code)
  return c.json(result)
})

export default room
