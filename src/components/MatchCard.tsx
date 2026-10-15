import { ArrowRight, Check, Clock3, GitCompareArrows, Map, Route, Users } from 'lucide-react'
import type { MatchResult } from '../types'
import { formatTime } from '../utils/time'
import { VerificationBadges } from './VerificationBadges'

interface Props {
  match: MatchResult
  selected: boolean
  compared: boolean
  compareDisabled: boolean
  onSelect: () => void
  onToggleCompare: () => void
  onBook: () => void
}

export function MatchCard({ match, selected, compared, compareDisabled, onSelect, onToggleCompare, onBook }: Props) {
  return (
    <article className={`rounded-[24px] border bg-white p-5 transition ${selected ? 'border-along-500 shadow-card ring-2 ring-along-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold text-white" style={{ backgroundColor: match.driver.accent }}>{match.driver.initials}</div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-ink">{match.driver.name}</h3>
            <p className="truncate text-xs text-slate-500">{match.driver.vehicleName} · {match.driver.vehiclePlateMasked}</p>
          </div>
        </div>
        <div className="shrink-0 rounded-2xl bg-mint-50 px-3 py-2 text-right">
          <strong className="block text-xl font-black leading-none text-mint-600">{match.compatibilityScore}%</strong>
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-mint-600">match</span>
        </div>
      </div>
      <div className="mt-3"><VerificationBadges user={match.driver} compact /></div>

      <button onClick={onSelect} className="mt-5 w-full text-left" aria-label={`View ${match.driver.name}'s route`}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center"><span className="h-2.5 w-2.5 rounded-full border-[3px] border-along-600 bg-white" /><span className="h-5 w-px bg-slate-300" /><span className="h-2.5 w-2.5 rounded-full bg-ink" /></div>
          <div className="min-w-0 flex-1 space-y-2 text-sm font-bold text-ink"><p className="truncate">{match.trip.origin.shortName}</p><p className="truncate">{match.trip.destination.shortName}</p></div>
          <Map className="h-4 w-4 text-slate-400" />
        </div>
      </button>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Metric icon={Route} label="Route overlap" value={`${match.routeOverlapPercent}%`} accent="text-mint-600" />
        <Metric icon={Clock3} label="Driver detour" value={`+${match.detourMinutes} min`} accent="text-ember-600" />
        <Metric icon={Clock3} label="Est. pickup" value={formatTime(match.estimatedPickupTime)} />
        <Metric icon={Users} label="Seats left" value={String(match.availableSeats)} />
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onToggleCompare} disabled={compareDisabled && !compared} className={`btn-secondary flex-1 px-3 ${compared ? 'border-along-500 bg-along-50 text-along-700' : ''}`}>
          {compared ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}{compared ? 'Selected' : 'Compare'}
        </button>
        <button onClick={onBook} className="btn-primary flex-1 px-3">Book <ArrowRight className="h-4 w-4" /></button>
      </div>
    </article>
  )
}

function Metric({ icon: Icon, label, value, accent = 'text-ink' }: { icon: typeof Route; label: string; value: string; accent?: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</div><div className={`mt-1 text-sm font-extrabold ${accent}`}>{value}</div></div>
}
