import { Hono } from 'hono'

const turn = new Hono()

const STUN_ONLY = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
]

turn.get('/', async (c) => {
  const apiKey = process.env['METERED_API_KEY']
  if (!apiKey) return c.json(STUN_ONLY)

  try {
    const res = await fetch(`https://sendnow.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`)
    if (!res.ok) return c.json(STUN_ONLY)
    const creds = await res.json() as RTCIceServer[]
    return c.json([...STUN_ONLY, ...creds])
  } catch {
    return c.json(STUN_ONLY)
  }
})

export default turn
