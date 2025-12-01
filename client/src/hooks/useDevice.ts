import { useEffect } from 'react'
import { detectDeviceType, getDeviceEmoji, getDeviceName } from '../lib/deviceInfo.ts'
import { useStore } from '../store/index.ts'

const PEER_ID_KEY = 'sendnow:peerId'

function getOrCreatePeerId(): string {
  const existing = sessionStorage.getItem(PEER_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(PEER_ID_KEY, id)
  return id
}

export function useDevice() {
  const { myDevice, setMyDevice } = useStore()

  useEffect(() => {
    if (myDevice) return
    const deviceType = detectDeviceType()
    setMyDevice({
      peerId: getOrCreatePeerId(),
      deviceName: getDeviceName(),
      deviceEmoji: getDeviceEmoji(deviceType),
      deviceType,
    })
  }, [myDevice, setMyDevice])

  return myDevice
}
