import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env['UPSTASH_REDIS_REST_URL']!,
  token: process.env['UPSTASH_REDIS_REST_TOKEN']!,
})

export async function setPeerMeta(peerId: string, meta: Record<string, string>, ttl = 300): Promise<void> {
  await redis.hset(`peer:${peerId}:meta`, meta)
  await redis.expire(`peer:${peerId}:meta`, ttl)
}

export async function getPeerMeta(peerId: string): Promise<Record<string, string> | null> {
  return redis.hgetall(`peer:${peerId}:meta`) as Promise<Record<string, string> | null>
}

export async function deletePeerMeta(peerId: string): Promise<void> {
  await redis.del(`peer:${peerId}:meta`)
}

export async function refreshPeerTTL(peerId: string): Promise<void> {
  await redis.expire(`peer:${peerId}:meta`, 300)
}

export async function addPeerToSubnet(subnet: string, peerId: string): Promise<void> {
  await redis.sadd(`lan:${subnet}`, peerId)
  await redis.expire(`lan:${subnet}`, 120)
}

export async function removePeerFromSubnet(subnet: string, peerId: string): Promise<void> {
  await redis.srem(`lan:${subnet}`, peerId)
}

export async function getSubnetPeers(subnet: string): Promise<string[]> {
  return redis.smembers(`lan:${subnet}`) as Promise<string[]>
}

export async function refreshSubnetTTL(subnet: string): Promise<void> {
  await redis.expire(`lan:${subnet}`, 120)
}

export async function createRoom(code: string, hostId: string, type: 'p2p' | 'broadcast' = 'p2p'): Promise<void> {
  await redis.hset(`room:${code}`, { hostId, created: String(Date.now()), type })
  await redis.expire(`room:${code}`, 1800)
}

export async function roomExists(code: string): Promise<boolean> {
  return (await redis.exists(`room:${code}`)) === 1
}

export async function addPeerToRoom(code: string, peerId: string): Promise<void> {
  await redis.sadd(`room:${code}:peers`, peerId)
  await redis.expire(`room:${code}:peers`, 1800)
}

export async function removePeerFromRoom(code: string, peerId: string): Promise<void> {
  await redis.srem(`room:${code}:peers`, peerId)
}

export async function getRoomPeerCount(code: string): Promise<number> {
  return redis.scard(`room:${code}:peers`)
}

export async function getRoomPeers(code: string): Promise<string[]> {
  return redis.smembers(`room:${code}:peers`) as Promise<string[]>
}
