import { z } from 'zod'

export type DeviceType = 'mobile' | 'laptop' | 'tablet' | 'desktop'

export type SignalMessage =
  | { type: 'join'; roomCode: string; peerId: string; deviceName: string; deviceEmoji: string; deviceType: DeviceType; subnet?: string }
  | { type: 'peer_joined'; peerId: string; deviceName: string; deviceEmoji: string; deviceType: string }
  | { type: 'peer_left'; peerId: string }
  | { type: 'offer'; to: string; from: string; sdp: { type: string; sdp?: string } }
  | { type: 'answer'; to: string; from: string; sdp: { type: string; sdp?: string } }
  | { type: 'ice'; to: string; from: string; candidate: { candidate: string; sdpMLineIndex?: number | null; sdpMid?: string | null; usernameFragment?: string | null } }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'error'; message: string }

export const JoinSchema = z.object({
  type: z.literal('join'),
  roomCode: z.string(),
  peerId: z.string().uuid(),
  deviceName: z.string().max(50),
  deviceEmoji: z.string().max(10),
  deviceType: z.enum(['mobile', 'laptop', 'tablet', 'desktop']),
  subnet: z.string().optional(),
})

const SdpSchema = z.object({
  type: z.string(),
  sdp: z.string().optional(),
})

const IceCandidateSchema = z.object({
  candidate: z.string(),
  sdpMLineIndex: z.number().nullable().optional(),
  sdpMid: z.string().nullable().optional(),
  usernameFragment: z.string().nullable().optional(),
})

export const SignalMessageSchema = z.discriminatedUnion('type', [
  JoinSchema,
  z.object({ type: z.literal('offer'), to: z.string().uuid(), from: z.string().uuid(), sdp: SdpSchema }),
  z.object({ type: z.literal('answer'), to: z.string().uuid(), from: z.string().uuid(), sdp: SdpSchema }),
  z.object({ type: z.literal('ice'), to: z.string().uuid(), from: z.string().uuid(), candidate: IceCandidateSchema }),
  z.object({ type: z.literal('ping') }),
  z.object({ type: z.literal('pong') }),
])

export const EnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  TURN_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  CLIENT_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof EnvSchema>

export interface WSData {
  peerId: string
  ip: string
  subnet: string
}

export interface PeerMeta {
  deviceName: string
  deviceEmoji: string
  deviceType: string
  room: string
}
