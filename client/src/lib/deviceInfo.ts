import type { DeviceType } from './types.ts'

export function detectDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase()
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return 'tablet'
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/.test(ua)) return 'mobile'
  if (/win|mac|linux/.test(navigator.platform?.toLowerCase() ?? '')) {
    // Distinguish laptop from desktop by touch support
    if (window.matchMedia('(pointer: fine)').matches && !navigator.maxTouchPoints) return 'desktop'
    return 'laptop'
  }
  return 'desktop'
}

export function getDeviceEmoji(type: DeviceType): string {
  const map: Record<DeviceType, string> = {
    mobile: '📱',
    tablet: '📟',
    laptop: '💻',
    desktop: '🖥️',
  }
  return map[type]
}

export function getDeviceName(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) {
    const match = ua.match(/Android [^;]+; ([^)]+)/)
    return match?.[1]?.trim() ?? 'Android'
  }
  if (/Mac/.test(navigator.platform ?? '')) return 'Mac'
  if (/Win/.test(navigator.platform ?? '')) return 'Windows PC'
  if (/Linux/.test(navigator.platform ?? '')) return 'Linux PC'
  return 'Browser'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatETA(seconds: number): string {
  if (seconds < 60) return `~${Math.ceil(seconds)}s`
  return `~${Math.ceil(seconds / 60)}m`
}

export function isURL(text: string): boolean {
  try {
    const url = new URL(text.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function getMimeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜️'
  if (mimeType.includes('text')) return '📝'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📄'
  return '📁'
}
