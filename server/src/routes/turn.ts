import { Hono } from 'hono'

const turn = new Hono()

// Free STUN/TURN servers — no API key required
// TURN from Open Relay Project (free, public)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: ['turn:a.relay.metered.ca:80', 'turn:a.relay.metered.ca:443', 'turns:a.relay.metered.ca:443'],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

turn.get('/', (c) => {
  return c.json(ICE_SERVERS)
})

export default turn
