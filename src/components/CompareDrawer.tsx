import { ArrowRight, Check, Clock3, Route, Sparkles, Users, X } from 'lucide-react'
import type { MatchResult } from '../types'
import { formatTime } from '../utils/time'

export function CompareDrawer({ matches, activeBookingTripId, onClose, onBook }: { matches: [MatchResult, MatchResult]; activeBookingTripId: string | null; onClose: () => void; onBook: (match: MatchResult) => void }) {
  const [first, second] = matches
  const recommended = first.compatibilityScore >= second.compatibilityScore ? first : second
  const other = recommended === first ? second : first
  const reason = recommended.detourMinutes < other.detourMinutes
    ? `adds ${other.detourMinutes - recommended.detourMinutes} fewer minutes to the driver's existing journey`
    : `shares ${recommended.routeOverlapPercent - other.routeOverlapPercent}% more of your route`

  return (
    <div className="dialog-overlay z-50" role="dialog" aria-modal="true" aria-label="Compare rides">
      <div className="dialog-panel max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div><span className="eyebrow">Compare rides</span><h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-ink">Two good ways to go.</h2></div>
          <button onClick={onClose} className="icon-button" aria-label="Close comparison"><X className="h-5 w-5" /></button>
        </div>

        <div className="comparison-grid mt-6 grid overflow-hidden rounded-xl border border-slate-200 text-sm">
          <div className="bg-slate-50 p-4" />
          {[first, second].map((match) => <div key={match.trip.id} className={`border-l border-slate-200 p-4 ${match === recommended ? 'bg-mint-50' : 'bg-slate-50'}`}><div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-semibold text-white" style={{ backgroundColor: match.driver.accent }}>{match.driver.initials}</span><strong className="text-xs font-semibold text-ink sm:text-sm">{match.driver.name}</strong></div>{match === recommended && <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold uppercase text-mint-600"><Check className="h-3 w-3 shrink-0" />Best fit</span>}</div>)}
          <ComparisonRow label="Match" icon={Sparkles} values={[`${first.compatibilityScore}%`, `${second.compatibilityScore}%`]} />
          <ComparisonRow label="Overlap" icon={Route} values={[`${first.routeOverlapPercent}%`, `${second.routeOverlapPercent}%`]} />
          <ComparisonRow label="Detour" icon={Clock3} values={[`+${first.detourMinutes} min`, `+${second.detourMinutes} min`]} />
          <ComparisonRow label="Pickup" icon={Clock3} values={[formatTime(first.estimatedPickupTime), formatTime(second.estimatedPickupTime)]} />
          <ComparisonRow label="Seats" icon={Users} values={[String(first.availableSeats), String(second.availableSeats)]} />
          <div className="border-t border-slate-200 p-3 text-xs font-bold text-slate-500">Choose</div>
          {[first, second].map((match) => <div key={match.trip.id} className="border-l border-t border-slate-200 p-3"><button onClick={() => onBook(match)} disabled={Boolean(activeBookingTripId)} className={match === recommended ? 'btn-primary w-full px-3' : 'btn-secondary w-full px-3'}>{activeBookingTripId === match.trip.id ? 'Booked' : activeBookingTripId ? 'Active ride' : <>Book <ArrowRight className="h-4 w-4" /></>}</button></div>)}
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl bg-along-50 p-4 text-sm leading-relaxed text-along-700"><Sparkles className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>{recommended.driver.name} is recommended</strong> because this ride {reason}.</p></div>
      </div>
    </div>
  )
}

function ComparisonRow({ label, icon: Icon, values }: { label: string; icon: typeof Route; values: [string, string] }) {
  return <><div className="comparison-label flex items-center gap-2 border-t border-slate-200 p-3 text-xs font-medium text-slate-500"><Icon className="h-3.5 w-3.5" />{label}</div>{values.map((value, index) => <div key={`${label}-${index}`} className="border-l border-t border-slate-200 p-3 font-semibold text-ink">{value}</div>)}</>
}
