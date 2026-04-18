const SERVER_URL = (import.meta.env['VITE_SERVER_URL'] as string | undefined)?.replace(/\/$/, '')
  ?? 'https://powerful-vision-production-a354.up.railway.app'

export function apiUrl(path: string): string {
  return `${SERVER_URL}${path}`
}
