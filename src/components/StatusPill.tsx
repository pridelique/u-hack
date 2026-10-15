import { Cloud, Database, Route } from 'lucide-react'

export function StatusPill({ storageMode, routingMode }: { storageMode: 'firebase' | 'demo'; routingMode: 'google' | 'demo' }) {
  const live = storageMode === 'firebase' && routingMode === 'google'
  const Icon = live ? Cloud : routingMode === 'google' ? Route : Database
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${live ? 'border-mint-100 bg-mint-50 text-mint-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
      <Icon className="h-3.5 w-3.5" />
      {live ? 'Live services connected' : 'Using demo route estimates'}
    </div>
  )
}
