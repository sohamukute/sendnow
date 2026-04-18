import type { ServerWebSocket } from 'bun'
import { SignalMessageSchema } from '../types.ts'
import type { WSData } from '../types.ts'
import { sendToWS, broadcastToSet } from '../lib/signaling.ts'
import {
  peerToWS, subnetToPeers, roomToPeers,
  registerPeer, unregisterPeer, getPeersInContext,
  heartbeat, incrementConnections, decrementConnections,
} from '../services/presence.ts'
import { joinRoom, leaveRoom } from '../services/rooms.ts'
import { extractSubnet } from '../lib/codegen.ts'
import { logger } from '../lib/logger.ts'

function getClientIP(ws: ServerWebSocket<WSData>): string {
  return ws.data.ip || '127.0.0.1'
}

export const websocketHandlers = {
  open(ws: ServerWebSocket<WSData>): void {
    incrementConnections()
    logger.info('ws', 'client connected', { ip: ws.data.ip })
  },

  async message(ws: ServerWebSocket<WSData>, raw: string | Buffer): Promise<void> {
    let parsed: unknown
    try {
      parsed = JSON.parse(typeof raw === 'string' ? raw : raw.toString())
    } catch {
      sendToWS(ws, { type: 'error', message: 'Invalid JSON' })
      return
    }

    const result = SignalMessageSchema.safeParse(parsed)
    if (!result.success) {
      sendToWS(ws, { type: 'error', message: 'Invalid message format' })
      return
    }

    const msg = result.data

    switch (msg.type) {
      case 'join': {
        const { peerId, roomCode, deviceName, deviceEmoji, deviceType } = msg
        if (ws.data.peerId) {
          sendToWS(ws, { type: 'error', message: 'Already joined' })
          return
        }
        const ip = getClientIP(ws)
        const subnet = extractSubnet(ip)

        const existingPeers = await getPeersInContext(peerId, subnet, roomCode || undefined)

        await registerPeer(
          ws,
          peerId,
          { deviceName, deviceEmoji, deviceType, room: roomCode || subnet },
          subnet,
          roomCode || undefined
        )

        if (roomCode) {
          await joinRoom(roomCode, peerId)
        }

        for (const existing of existingPeers) {
          sendToWS(ws, {
            type: 'peer_joined',
            peerId: existing.peerId,
            deviceName: existing.deviceName,
            deviceEmoji: existing.deviceEmoji,
            deviceType: existing.deviceType,
          })
        }

        const peerSet = roomCode
          ? (roomToPeers.get(roomCode) ?? new Set<string>())
          : (subnetToPeers.get(subnet) ?? new Set<string>())

        broadcastToSet(peerSet, peerToWS, {
          type: 'peer_joined',
          peerId,
          deviceName,
          deviceEmoji,
          deviceType,
        }, peerId)

        logger.info('ws', 'peer joined', { peerId, room: roomCode || subnet })
        break
      }

      case 'offer':
      case 'answer':
      case 'ice': {
        const target = peerToWS.get(msg.to)
        if (target) {
          sendToWS(target, { ...msg, from: ws.data.peerId })
        } else {
          sendToWS(ws, { type: 'error', message: `Peer ${msg.to} not found` })
        }
        break
      }

      case 'ping': {
        const peerId = ws.data.peerId
        if (peerId) await heartbeat(peerId, ws.data.subnet)
        sendToWS(ws, { type: 'pong' })
        break
      }

      default:
        break
    }
  },

  async close(ws: ServerWebSocket<WSData>, code: number, _reason: string): Promise<void> {
    decrementConnections()
    const { peerId, subnet } = ws.data
    if (!peerId) return

    let roomCode: string | undefined
    for (const [rc, peers] of roomToPeers) {
      if (peers.has(peerId)) {
        roomCode = rc
        break
      }
    }

    await unregisterPeer(peerId, subnet, roomCode)
    if (roomCode) await leaveRoom(roomCode, peerId)

    // Notify remaining peers
    const peerLeft = { type: 'peer_left' as const, peerId }

    if (roomCode) {
      const roomSet = roomToPeers.get(roomCode)
      if (roomSet) broadcastToSet(roomSet, peerToWS, peerLeft)
    }

    const subnetSet = subnetToPeers.get(subnet)
    if (subnetSet) broadcastToSet(subnetSet, peerToWS, peerLeft)

    logger.info('ws', 'peer disconnected', { peerId, code })
  },
}
