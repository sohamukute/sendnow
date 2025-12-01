import { useEffect, useRef, useCallback } from 'react'
import type { SignalMessage, DeviceInfo } from '../lib/types.ts'
import { useStore } from '../store/index.ts'

function getWSUrl(): string {
  const serverUrl = import.meta.env['VITE_SERVER_URL'] as string | undefined
  if (serverUrl) {
    return serverUrl.replace(/^http/, 'ws') + '/ws'
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/ws`
}

type MessageHandler = (msg: SignalMessage) => void

export function useSignaling(device: DeviceInfo | null, onMessage: MessageHandler, roomCode?: string) {
  const ws = useRef<WebSocket | null>(null)
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelay = useRef(1000)
  const destroyed = useRef(false)
  const { setWsStatus, addPeer, removePeer } = useStore()

  const sendSignal = useCallback((msg: SignalMessage): void => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg))
    }
  }, [])

  const connect = useCallback(() => {
    if (destroyed.current || !device) return

    setWsStatus('connecting')
    const socket = new WebSocket(getWSUrl())
    ws.current = socket

    socket.onopen = () => {
      reconnectDelay.current = 1000
      setWsStatus('connected')

      socket.send(JSON.stringify({
        type: 'join',
        roomCode: roomCode ?? '',
        peerId: device.peerId,
        deviceName: device.deviceName,
        deviceEmoji: device.deviceEmoji,
        deviceType: device.deviceType,
      } satisfies SignalMessage))

      pingTimer.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' } satisfies SignalMessage))
        }
      }, 25000)
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(event.data)
      } catch {
        return
      }

      const msg = parsed as SignalMessage

      // Handle peer join/leave in store
      if (msg.type === 'peer_joined') {
        addPeer({
          peerId: msg.peerId,
          deviceName: msg.deviceName,
          deviceEmoji: msg.deviceEmoji,
          deviceType: msg.deviceType,
          connected: true,
        })
      } else if (msg.type === 'peer_left') {
        removePeer(msg.peerId)
      }

      onMessage(msg)
    }

    socket.onclose = () => {
      if (destroyed.current) return
      if (pingTimer.current) clearInterval(pingTimer.current)
      setWsStatus('reconnecting')

      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000)
        connect()
      }, reconnectDelay.current)
    }

    socket.onerror = () => {
      setWsStatus('disconnected')
    }
  }, [device, roomCode, onMessage, addPeer, removePeer, setWsStatus])

  useEffect(() => {
    if (!device) return
    connect()

    return () => {
      destroyed.current = true
      if (pingTimer.current) clearInterval(pingTimer.current)
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [device, connect])

  return { sendSignal }
}
