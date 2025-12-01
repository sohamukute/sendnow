import type { ServerWebSocket } from 'bun'
import type { SignalMessage, WSData } from '../types.ts'

export function sendToWS(ws: ServerWebSocket<WSData>, msg: SignalMessage): void {
  try {
    ws.send(JSON.stringify(msg))
  } catch {
    // Client already disconnected — ignore
  }
}

export function broadcastToSet(
  peerIds: Set<string>,
  peerToWS: Map<string, ServerWebSocket<WSData>>,
  msg: SignalMessage,
  exclude?: string
): void {
  for (const peerId of peerIds) {
    if (peerId === exclude) continue
    const ws = peerToWS.get(peerId)
    if (ws) sendToWS(ws, msg)
  }
}
