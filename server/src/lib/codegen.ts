// No confusing chars: 0/O, 1/I
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(length = 4): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes).map(b => CHARS[b % CHARS.length]).join('')
}

export function extractSubnet(ip: string): string {
  const parts = ip.split('.')
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`
  // IPv6 or unusual — use first segment
  return ip.split(':').slice(0, 2).join(':') || 'local'
}
