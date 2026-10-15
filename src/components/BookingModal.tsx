import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, MapPin, Route, Users, X } from 'lucide-react'
import type { MatchResult, SearchInput } from '../types'
import { formatTime } from '../utils/time'

interface Props {
  match: MatchResult
  search: SearchInput
  state: 'idle' | 'booking' | 'success'
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export function BookingModal({ match, search, state, error, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Confirm booking">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        {state === 'success' ? (
          <div className="py-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-50 text-mint-600"><CheckCircle2 className="h-8 w-8" /></div>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.03em] text-ink">Ride booked.</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">You’re going with {match.driver.name}. Their remaining seat count has been updated.</p>
            <button onClick={onClose} className="btn-primary mt-6 w-full">Back to matches <ArrowRight className="h-4 w-4" /></button>
          </div>
        ) : <>
          <div className="flex items-start justify-between gap-4"><div><span className="eyebrow">One last check</span><h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-ink">Confirm your ride</h2></div><button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-white" style={{ backgroundColor: match.driver.accent }}>{match.driver.initials}</span><div><strong className="text-sm text-ink">{match.driver.name}</strong><p className="text-xs text-slate-500">{match.driver.vehicleName} · Demo verified</p></div></div>
          <div className="mt-5 space-y-4">
            <Detail icon={MapPin} label="Pickup" value={search.origin.shortName} />
            <Detail icon={Clock3} label="Estimated pickup" value={`~${formatTime(match.estimatedPickupTime)}`} />
            <Detail icon={MapPin} label="Drop-off" value={search.destination.shortName} />
            <div className="grid grid-cols-2 gap-3"><Detail icon={Users} label="Seats" value="1" compact /><Detail icon={Route} label="Driver detour" value={`+${match.detourMinutes} min`} compact /></div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button onClick={onConfirm} disabled={state === 'booking'} className="btn-primary mt-6 w-full">{state === 'booking' ? <><LoaderCircle className="h-4 w-4 animate-spin" />Booking…</> : <>Confirm booking <ArrowRight className="h-4 w-4" /></>}</button>
          <p className="mt-3 text-center text-[11px] text-slate-400">No payment required for this prototype.</p>
        </>}
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value, compact = false }: { icon: typeof MapPin; label: string; value: string; compact?: boolean }) {
  return <div className={`flex items-center gap-3 ${compact ? 'rounded-2xl bg-slate-50 p-3' : ''}`}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-along-50 text-along-600"><Icon className="h-4 w-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-0.5 text-sm font-extrabold text-ink">{value}</p></div></div>
}
