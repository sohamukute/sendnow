import { create } from 'zustand'
import type { Peer, Transfer, HistoryEntry, DeviceInfo } from '../lib/types.ts'

interface SendNowStore {
  myDevice: DeviceInfo | null
  peers: Map<string, Peer>
  selectedPeerId: string | null
  transfers: Map<string, Transfer>
  history: HistoryEntry[]
  roomCode: string | null
  wsStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  reconnectDelay: number

  setMyDevice: (device: DeviceInfo) => void
  addPeer: (peer: Peer) => void
  removePeer: (peerId: string) => void
  selectPeer: (peerId: string | null) => void
  addTransfer: (transfer: Transfer) => void
  updateTransfer: (id: string, updates: Partial<Transfer>) => void
  removeTransfer: (id: string) => void
  addHistoryEntry: (entry: HistoryEntry) => void
  setRoomCode: (code: string | null) => void
  setWsStatus: (status: SendNowStore['wsStatus']) => void
  setReconnectDelay: (delay: number) => void
}

export const useStore = create<SendNowStore>((set) => ({
  myDevice: null,
  peers: new Map(),
  selectedPeerId: null,
  transfers: new Map(),
  history: [],
  roomCode: null,
  wsStatus: 'connecting',
  reconnectDelay: 1000,

  setMyDevice: (device) => set({ myDevice: device }),

  addPeer: (peer) =>
    set((state) => {
      const next = new Map(state.peers)
      next.set(peer.peerId, peer)
      return { peers: next }
    }),

  removePeer: (peerId) =>
    set((state) => {
      const next = new Map(state.peers)
      // Mark as disconnected rather than removing immediately for visual feedback
      const peer = next.get(peerId)
      if (peer) next.set(peerId, { ...peer, connected: false })
      // Clean up after animation
      setTimeout(() => {
        set((s) => {
          const m = new Map(s.peers)
          m.delete(peerId)
          return { peers: m }
        })
      }, 2000)
      return { peers: next }
    }),

  selectPeer: (peerId) => set({ selectedPeerId: peerId }),

  addTransfer: (transfer) =>
    set((state) => {
      const next = new Map(state.transfers)
      next.set(transfer.id, transfer)
      return { transfers: next }
    }),

  updateTransfer: (id, updates) =>
    set((state) => {
      const next = new Map(state.transfers)
      const existing = next.get(id)
      if (existing) next.set(id, { ...existing, ...updates })
      return { transfers: next }
    }),

  removeTransfer: (id) =>
    set((state) => {
      const next = new Map(state.transfers)
      next.delete(id)
      return { transfers: next }
    }),

  addHistoryEntry: (entry) =>
    set((state) => ({ history: [entry, ...state.history].slice(0, 50) })),

  setRoomCode: (code) => set({ roomCode: code }),

  setWsStatus: (status) => set({ wsStatus: status }),

  setReconnectDelay: (delay) => set({ reconnectDelay: delay }),
}))
