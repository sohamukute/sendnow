export function apiUrl(path: string): string {
  const base = (import.meta.env['VITE_SERVER_URL'] as string | undefined)?.replace(/\/$/, '')
  return base ? `${base}${path}` : path
}
