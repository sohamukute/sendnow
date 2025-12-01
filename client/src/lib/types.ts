export type DeviceType = 'mobile' | 'laptop' | 'tablet' | 'desktop'

export type SignalMessage =
  | { type: 'join'; roomCode: string; peerId: string; deviceName: string; deviceEmoji: string; deviceType: DeviceType; subnet?: string }
  | { type: 'peer_joined'; peerId: string; deviceName: string; deviceEmoji: string; deviceType: string }
  | { type: 'peer_left'; peerId: string }
  | { type: 'offer'; to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; to: string; from: string; candidate: RTCIceCandidateInit }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'error'; message: string }

export interface Peer {
  peerId: string
  deviceName: string
  deviceEmoji: string
  deviceType: string
  connected: boolean
}

export type TransferType = 'file' | 'text' | 'link'
export type TransferStatus = 'pending' | 'transferring' | 'complete' | 'error' | 'cancelled' | 'declined'

export interface Transfer {
  id: string
  peerId: string
  peerName: string
  peerEmoji: string
  direction: 'send' | 'receive'
  type: TransferType
  filename: string
  mimeType: string
  size: number
  totalChunks: number
  progress: number
  speed: number
  eta: number
  status: TransferStatus
  blobUrl?: string
  content?: string
  error?: string
}

export interface HistoryEntry {
  id: string
  direction: 'send' | 'receive'
  type: TransferType
  filename: string
  size: number
  speed: number
  completedAt: Date
  blobUrl?: string
  content?: string
}

export interface DeviceInfo {
  peerId: string
  deviceName: string
  deviceEmoji: string
  deviceType: DeviceType
}

export interface TransferMetadata {
  type: 'metadata'
  transferId: string
  filename: string
  mimeType: string
  size: number
  totalChunks: number
  transferType: TransferType
  content?: string
}

export interface DataChannelControl {
  type: 'accepted' | 'declined' | 'cancel'
  transferId: string
}

export type DataChannelMessage = TransferMetadata | DataChannelControl
