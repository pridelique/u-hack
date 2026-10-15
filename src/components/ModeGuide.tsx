import { CarFront, Search } from 'lucide-react'

export function ModeGuide({ mode }: { mode: 'passenger' | 'driver' }) {
  const passenger = mode === 'passenger'
  const Icon = passenger ? Search : CarFront

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${passenger ? 'bg-along-50 text-along-600' : 'bg-mint-50 text-mint-600'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-ink">{passenger ? 'Passenger mode' : 'Driver mode'}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {passenger ? 'Enter your route → compare published trips → keep one active booking.' : 'Review your draft → publish it → end the trip before creating another.'}
        </p>
      </div>
    </div>
  )
}
