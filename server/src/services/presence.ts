import type { ServerWebSocket } from 'bun'
import type { WSData, PeerMeta } from '../types.ts'
import {
  setPeerMeta, deletePeerMeta, getPeerMeta,
  addPeerToSubnet, removePeerFromSubnet,
  refreshPeerTTL, refreshSubnetTTL,
} from './redis.ts'
import { logger } from '../lib/logger.ts'

export const peerToWS = new Map<string, ServerWebSocket<WSData>>()
export const subnetToPeers = new Map<string, Set<string>>()
export const roomToPeers = new Map<string, Set<string>>()

const peerMetaCache = new Map<string, PeerMeta>()

export let activeConnections = 0

export function incrementConnections(): void { activeConnections++ }
export function decrementConnections(): void { activeConnections = Math.max(0, activeConnections - 1) }

export async function registerPeer(
  ws: ServerWebSocket<WSData>,
  peerId: string,
  meta: PeerMeta,
  subnet: string,
  roomCode?: string
): Promise<void> {
  ws.data.peerId = peerId
  ws.data.subnet = subnet

  peerToWS.set(peerId, ws)
  peerMetaCache.set(peerId, meta)

  setPeerMeta(peerId, { ...meta, room: roomCode || subnet }).catch(() => {})
  addPeerToSubnet(subnet, peerId).catch(() => {})

  if (roomCode) {
    const existing = roomToPeers.get(roomCode) ?? new Set()
    existing.add(peerId)
    roomToPeers.set(roomCode, existing)
  }

  const subnetSet = subnetToPeers.get(subnet) ?? new Set()
  subnetSet.add(peerId)
  subnetToPeers.set(subnet, subnetSet)

  logger.info('presence', 'peer registered', { peerId, subnet, roomCode })
}

export async function unregisterPeer(peerId: string, subnet: string, roomCode?: string): Promise<void> {
  peerToWS.delete(peerId)
  peerMetaCache.delete(peerId)

  const subnetSet = subnetToPeers.get(subnet)
  if (subnetSet) {
    subnetSet.delete(peerId)
    if (subnetSet.size === 0) subnetToPeers.delete(subnet)
  }

  if (roomCode) {
    const roomSet = roomToPeers.get(roomCode)
    if (roomSet) {
      roomSet.delete(peerId)
      if (roomSet.size === 0) roomToPeers.delete(roomCode)
    }
  }

  deletePeerMeta(peerId).catch(() => {})
  removePeerFromSubnet(subnet, peerId).catch(() => {})

  logger.info('presence', 'peer unregistered', { peerId })
}

export async function getPeersInContext(
  peerId: string,
  subnet: string,
  roomCode?: string
): Promise<Array<{ peerId: string } & PeerMeta>> {
  const peerIds = roomCode
    ? Array.from(roomToPeers.get(roomCode) ?? []).filter(id => id !== peerId)
    : Array.from(subnetToPeers.get(subnet) ?? []).filter(id => id !== peerId)

  const results: Array<{ peerId: string } & PeerMeta> = []
  for (const id of peerIds) {
    const cached = peerMetaCache.get(id)
    if (cached) {
      results.push({ peerId: id, ...cached })
      continue
    }
    const redisMeta = await getPeerMeta(id).catch(() => null)
    if (redisMeta) {
      results.push({
        peerId: id,
        deviceName: redisMeta['deviceName'] ?? '',
        deviceEmoji: redisMeta['deviceEmoji'] ?? '',
        deviceType: redisMeta['deviceType'] ?? 'desktop',
        room: redisMeta['room'] ?? '',
      })
    }
  }
  return results
}

export async function heartbeat(peerId: string, subnet: string): Promise<void> {
  refreshPeerTTL(peerId).catch(() => {})
  refreshSubnetTTL(subnet).catch(() => {})
}
