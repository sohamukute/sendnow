import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import type { Server } from 'bun'
import type { WSData } from './types.ts'
import { EnvSchema } from './types.ts'
import { websocketHandlers } from './routes/ws.ts'
import roomRoutes from './routes/room.ts'
import turnRoutes from './routes/turn.ts'
import { activeConnections } from './services/presence.ts'
import { logger } from './lib/logger.ts'

const envResult = EnvSchema.safeParse(process.env)
if (!envResult.success) {
  console.error('[ERROR] Missing or invalid environment variables:')
  for (const issue of envResult.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

const env = envResult.data

const app = new Hono()

const allowedOrigin = env.CLIENT_URL ?? (env.NODE_ENV === 'production' ? 'https://sendnowp2p.vercel.app' : 'http://localhost:5173')

app.use('*', cors({
  origin: allowedOrigin,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    connections: activeConnections,
    uptime: Math.floor(process.uptime()),
  })
})

app.route('/api/room', roomRoutes)
app.route('/api/turn-creds', turnRoutes)

if (env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: '../client/dist' }))
  app.get('/*', serveStatic({ path: '../client/dist/index.html' }))
}

export default {
  port: env.PORT,
  fetch(req: Request, server: Server<WSData>): Response | undefined {
    const url = new URL(req.url)

    if (url.pathname === '/ws') {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        '127.0.0.1'

      const success = server.upgrade(req, {
        data: { peerId: '', ip, subnet: '' },
      })
      if (success) return undefined
      return new Response('WebSocket upgrade failed', { status: 400 })
    }

    return app.fetch(req) as Response
  },
  websocket: {
    ...websocketHandlers,
    maxPayloadLength: 64 * 1024,
  },
}

logger.info('server', 'started', { port: env.PORT, env: env.NODE_ENV })
