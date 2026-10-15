import { Cloud, Database, Route } from 'lucide-react'

export function StatusPill({ storageMode, routingMode }: { storageMode: 'firebase' | 'demo'; routingMode: 'longdo' | 'demo' }) {
  const live = storageMode === 'firebase' && routingMode === 'longdo'
  const hasLiveRoutes = routingMode === 'longdo'
  const Icon = live ? Cloud : hasLiveRoutes ? Route : Database
  const label = live
    ? 'Live services connected'
    : hasLiveRoutes
      ? 'Longdo connected · demo storage'
      : storageMode === 'firebase'
        ? 'Firebase connected · demo routes'
        : 'Using demo route estimates'
  return (
    <div className={`inline-flex items-center gap-2 text-[11px] font-medium ${live ? 'text-mint-600' : 'text-amber-800'}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}
