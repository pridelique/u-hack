import { useState } from 'react'
import { ArrowLeft, CarFront, CheckCircle2, LoaderCircle, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { BookingModal } from '../components/BookingModal'
import { CompareDrawer } from '../components/CompareDrawer'
import { LocationInput } from '../components/LocationInput'
import { MapPanel } from '../components/MapPanel'
import { MatchCard } from '../components/MatchCard'
import { LOCATIONS } from '../data/locations'
import { demoUsers } from '../data/demoUsers'
import { findMatches } from '../matching/matchingEngine'
import { bookMatch } from '../services/tripsService'
import type { AppPage, MatchResult, SearchInput, Trip, User } from '../types'
import { todayISO } from '../utils/time'

export function SearchPage({ user, trips, onNavigate, onTripUpdate }: { user: User; trips: Trip[]; onNavigate: (page: AppPage) => void; onTripUpdate: (trip: Trip) => void }) {
  const [search, setSearch] = useState<SearchInput>({ origin: LOCATIONS[2], destination: LOCATIONS[3], date: todayISO(), preferredTime: '17:10', womenOnly: false })
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [booking, setBooking] = useState<MatchResult | null>(null)
  const [bookingState, setBookingState] = useState<'idle' | 'booking' | 'success'>('idle')
  const [bookingError, setBookingError] = useState<string | null>(null)

  const handleSearch = async () => {
    setSearching(true); setHasSearched(true); setCompareIds([])
    const results = await findMatches(trips, demoUsers, search)
    setMatches(results); setSelectedId(results[0]?.trip.id ?? null); setSearching(false)
  }

  const toggleCompare = (tripId: string) => setCompareIds((current) => current.includes(tripId) ? current.filter((id) => id !== tripId) : current.length < 2 ? [...current, tripId] : current)
  const selected = matches.find((match) => match.trip.id === selectedId) ?? matches[0] ?? null
  const compared = compareIds.map((id) => matches.find((match) => match.trip.id === id)).filter((item): item is MatchResult => Boolean(item))

  const confirmBooking = async () => {
    if (!booking) return
    setBookingState('booking'); setBookingError(null)
    try {
      const { updatedTrip } = await bookMatch(booking, user.id, search.origin, search.destination)
      onTripUpdate(updatedTrip)
      setMatches((current) => current.map((match) => match.trip.id === updatedTrip.id ? { ...match, trip: updatedTrip, availableSeats: updatedTrip.availableSeats } : match))
      setBookingState('success')
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Booking could not be completed.')
      setBookingState('idle')
    }
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink"><ArrowLeft className="h-4 w-4" />Back</button>
      <div className="mt-4 grid gap-5 xl:grid-cols-[500px_1fr]">
        <div className="space-y-4">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><span className="eyebrow">Passenger search</span><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink">Who’s already going your way?</h1></div><div className="hidden h-12 w-12 place-items-center rounded-2xl bg-along-50 text-along-600 sm:grid"><Search className="h-5 w-5" /></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2"><LocationInput label="Pickup area" value={search.origin} onChange={(origin) => setSearch({ ...search, origin })} /><LocationInput label="Destination" value={search.destination} onChange={(destination) => setSearch({ ...search, destination })} /></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><label><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Date</span><input type="date" min={todayISO()} value={search.date} onChange={(event) => setSearch({ ...search, date: event.target.value })} className="field" /></label><label><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Preferred time</span><input type="time" value={search.preferredTime} onChange={(event) => setSearch({ ...search, preferredTime: event.target.value })} className="field" /></label></div>
            <div className="mt-5"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500"><ShieldCheck className="h-4 w-4" />Driver preference</div><div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"><PreferenceButton active={!search.womenOnly} onClick={() => setSearch({ ...search, womenOnly: false })}>Any verified driver</PreferenceButton><PreferenceButton active={search.womenOnly} onClick={() => setSearch({ ...search, womenOnly: true })}>Women drivers only</PreferenceButton></div><p className="mt-2 text-[11px] text-slate-400">Uses the explicit gender field in demo profiles. It is never inferred.</p></div>
            <button onClick={handleSearch} disabled={searching} className="btn-primary mt-6 w-full py-3.5">{searching ? <><LoaderCircle className="h-4 w-4 animate-spin" />Checking routes & detours…</> : <><Search className="h-4 w-4" />Find rides</>}</button>
          </section>

          {hasSearched && !searching && <section>
            <div className="mb-3 flex items-end justify-between"><div><h2 className="text-xl font-black tracking-[-0.03em] text-ink">{matches.length ? `${matches.length} compatible rides` : 'No compatible rides'}</h2><p className="mt-1 text-xs text-slate-500">Ranked after hard constraints and actual detour checks.</p></div>{matches.length > 1 && <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400"><SlidersHorizontal className="h-3.5 w-3.5" />Best first</span>}</div>
            {matches.length ? <div className="space-y-3">{matches.map((match) => <MatchCard key={match.trip.id} match={match} selected={selected?.trip.id === match.trip.id} compared={compareIds.includes(match.trip.id)} compareDisabled={compareIds.length >= 2} onSelect={() => setSelectedId(match.trip.id)} onToggleCompare={() => toggleCompare(match.trip.id)} onBook={() => { setBooking(match); setBookingState('idle'); setBookingError(null) }} />)}</div> : <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><CarFront className="h-5 w-5" /></div><h3 className="mt-4 font-extrabold text-ink">No compatible rides found for this route and time.</h3><p className="mt-2 text-sm leading-6 text-slate-500">Try adjusting your departure time or searching again later.</p></div>}
          </section>}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <MapPanel origin={search.origin} destination={search.destination} match={selected} secondaryMatch={compared.length === 2 ? compared[1] : null} title={selected ? `${selected.driver.name}'s route match` : 'Your search area'} />
          {selected ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><MapMetric color="bg-mint-500" label="Route overlap" value={`${selected.routeOverlapPercent}%`} /><MapMetric color="bg-ember-500" label="Driver detour" value={`+${selected.detourMinutes} min`} /><MapMetric color="bg-along-500" label="Why it fits" value={`${selected.compatibilityScore}% match`} /></div> : <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500"><strong className="text-ink">Not the nearest driver.</strong> Along looks for verified drivers whose planned route and timing already align with yours.</div>}
          {compareIds.length === 1 && <div className="mt-4 flex items-center gap-3 rounded-2xl border border-along-100 bg-along-50 p-4 text-sm text-along-700"><CheckCircle2 className="h-5 w-5 shrink-0" /><p><strong>One ride selected.</strong> Choose one more to compare side by side.</p></div>}
        </aside>
      </div>

      {compared.length === 2 && <CompareDrawer matches={[compared[0], compared[1]]} onClose={() => setCompareIds([])} onBook={(match) => { setCompareIds([]); setBooking(match); setBookingState('idle') }} />}
      {booking && <BookingModal match={booking} search={search} state={bookingState} error={bookingError} onConfirm={confirmBooking} onClose={() => { setBooking(null); setBookingState('idle'); setBookingError(null) }} />}
    </main>
  )
}

function PreferenceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${active ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}>{children}</button> }
function MapMetric({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className={`h-9 w-1.5 rounded-full ${color}`} /><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p><strong className="mt-0.5 block text-sm text-ink">{value}</strong></div></div> }
