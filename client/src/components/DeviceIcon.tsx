import { Smartphone, Tablet, Laptop, Monitor } from 'lucide-react'

interface Props {
  type: string
  className?: string
}

export function DeviceIcon({ type, className = 'w-8 h-8' }: Props) {
  const props = { className }
  switch (type) {
    case 'mobile': return <Smartphone {...props} />
    case 'tablet': return <Tablet {...props} />
    case 'laptop': return <Laptop {...props} />
    case 'desktop': return <Monitor {...props} />
    default: return <Monitor {...props} />
  }
}
