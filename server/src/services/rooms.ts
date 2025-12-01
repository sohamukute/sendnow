import { generateRoomCode } from '../lib/codegen.ts'
import { createRoom as redisCreateRoom, roomExists as redisRoomExists, addPeerToRoom, getRoomPeerCount, removePeerFromRoom } from './redis.ts'
import { roomToPeers } from './presence.ts'
import { logger } from '../lib/logger.ts'

// In-memory room registry — primary store
const rooms = new Map<string, { hostId: string; type: 'p2p' | 'broadcast'; created: number }>()

export async function createNewRoom(hostId: string, type: 'p2p' | 'broadcast' = 'p2p'): Promise<string> {
  let code: string
  let attempts = 0
  do {
    code = generateRoomCode()
    attempts++
    if (attempts > 20) throw new Error('Failed to generate unique room code')
  } while (rooms.has(code))

  rooms.set(code, { hostId, type, created: Date.now() })

  // Redis — best effort for persistence across restarts
  redisCreateRoom(code, hostId, type).catch(() => {})

  logger.info('rooms', 'room created', { code, hostId, type })
  return code
}

export async function checkRoom(code: string): Promise<{ exists: boolean; peerCount: number }> {
  if (rooms.has(code)) {
    const peerCount = (roomToPeers.get(code) ?? new Set()).size
    return { exists: true, peerCount }
  }
  // Fallback: Redis (for rooms created by other instances)
  try {
    const exists = await redisRoomExists(code)
    if (!exists) return { exists: false, peerCount: 0 }
    const peerCount = await getRoomPeerCount(code)
    return { exists: true, peerCount }
  } catch {
    return { exists: false, peerCount: 0 }
  }
}

export async function joinRoom(code: string, peerId: string): Promise<boolean> {
  if (!rooms.has(code)) {
    // Try Redis for cross-instance rooms
    try {
      const exists = await redisRoomExists(code)
      if (!exists) return false
      rooms.set(code, { hostId: '', type: 'p2p', created: Date.now() }) // Reconstitute
    } catch {
      return false
    }
  }
  addPeerToRoom(code, peerId).catch(() => {})
  return true
}

export async function leaveRoom(code: string, peerId: string): Promise<void> {
  removePeerFromRoom(code, peerId).catch(() => {})
  logger.info('rooms', 'peer left room', { code, peerId })
}

export function purgeExpiredRooms(): void {
  const maxAge = 30 * 60 * 1000 // 30 minutes
  const now = Date.now()
  for (const [code, room] of rooms) {
    if (now - room.created > maxAge) {
      rooms.delete(code)
      roomToPeers.delete(code)
    }
  }
}

// Purge every 5 minutes
setInterval(purgeExpiredRooms, 5 * 60 * 1000)
