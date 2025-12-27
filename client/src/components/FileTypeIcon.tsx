import { Image, Video, Music, FileText, Archive, File, Sheet } from 'lucide-react'

interface Props {
  mimeType: string
  className?: string
}

export function FileTypeIcon({ mimeType, className = 'w-5 h-5' }: Props) {
  const p = { className }
  if (mimeType.startsWith('image/')) return <Image {...p} />
  if (mimeType.startsWith('video/')) return <Video {...p} />
  if (mimeType.startsWith('audio/')) return <Music {...p} />
  if (mimeType.includes('pdf')) return <FileText {...p} />
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('tar') || mimeType.includes('gzip')) return <Archive {...p} />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <Sheet {...p} />
  if (mimeType.includes('text') || mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <FileText {...p} />
  return <File {...p} />
}
