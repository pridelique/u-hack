import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock3, Gauge, LoaderCircle, Users } from 'lucide-react'
import { LocationInput } from '../components/LocationInput'
import { MapPanel } from '../components/MapPanel'
import { ModeGuide } from '../components/ModeGuide'
import { getDemoDriverDraft } from '../data/demoTrips'
import { calculateRoute } from '../services/routesService'
import { completeDriverTrips, isDemoSeedTrip, publishTrip } from '../services/tripsService'
import type { AppPage, RouteSummary, Trip, User } from '../types'
import { addMinutes, combineDateTime, formatDistance, formatDuration, formatTime, todayISO } from '../utils/time'

interface Props {
  user: User
  trips: Trip[]
  onNavigate: (page: AppPage) => void
  onPublished: (trip: Trip) => void
  onTripsCompleted: (driverId: string) => void
}

export function PublishPage({ user, trips, onNavigate, onPublished, onTripsCompleted }: Props) {
  const draft = getDemoDriverDraft(user.id)
  const [origin, setOrigin] = useState(draft.origin)
  const [destination, setDestination] = useState(draft.destination)
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState<string>(draft.time)
  const [seats, setSeats] = useState<number>(draft.seats)
  const [detour, setDetour] = useState<number>(draft.maxDetourMinutes)
  const [route, setRoute] = useState<RouteSummary | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeTrips = trips.filter((trip) => trip.driverId === user.id && !isDemoSeedTrip(trip) && (trip.status === 'upcoming' || trip.status === 'full'))
  const activeTrip = activeTrips[0]
  const [activeRoute, setActiveRoute] = useState<RouteSummary | null>(null)
  const [activeRouteLoading, setActiveRouteLoading] = useState(false)

  useEffect(() => {
    if (activeTrip) return
    let active = true
    setCalculating(true)
    calculateRoute([origin, destination]).then((result) => active && setRoute(result)).finally(() => active && setCalculating(false))
    return () => { active = false }
  }, [activeTrip, destination, origin])

  useEffect(() => {
    if (!activeTrip) {
      setActiveRoute(null)
      setActiveRouteLoading(false)
      return
    }
    if (activeTrip.route?.source === 'google') {
      setActiveRoute(activeTrip.route)
      setActiveRouteLoading(false)
      return
    }

    let active = true
    setActiveRoute(null)
    setActiveRouteLoading(true)
    calculateRoute([activeTrip.origin, activeTrip.destination])
      .then((result) => active && setActiveRoute(result))
      .finally(() => active && setActiveRouteLoading(false))
    return () => { active = false }
  }, [activeTrip])

  const handlePublish = async () => {
    if (!route) return
    setPublishing(true); setError(null)
    const trip: Trip = {
      id: `trip-${user.id}-${Date.now()}`,
      driverId: user.role === 'driver' ? user.id : 'driver-nicha',
      origin, destination, departureTime: combineDateTime(date, time),
      totalSeats: seats, availableSeats: seats, maxDetourMinutes: detour,
      baselineDistanceMeters: route.distanceMeters, baselineDurationSeconds: route.durationSeconds,
      status: 'upcoming', createdAt: new Date().toISOString(), route,
    }
    try {
      await publishTrip(trip)
      onPublished(trip)
      setPublished(true)
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Trip could not be published.')
    } finally {
      setPublishing(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true); setError(null)
    try {
      await completeDriverTrips(user.id)
      onTripsCompleted(user.id)
      setPublished(false)
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Trip could not be completed.')
    } finally {
      setCompleting(false)
    }
  }

  if (published) return <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-2xl place-items-center px-5 py-12"><div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-soft"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-50 text-mint-600"><CheckCircle2 className="h-8 w-8" /></div><h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-ink">Your trip is live.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Passengers traveling in the same direction can find it immediately. You’ll accept up to {detour} minutes of detour.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => onNavigate('search')} className="btn-primary px-6">Test passenger search <ArrowRight className="h-4 w-4" /></button><button onClick={() => setPublished(false)} className="btn-secondary px-6">View active trip</button></div></div></main>

  if (activeTrips.length) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink"><ArrowLeft className="h-4 w-4" />Back</button>
        <div className="mt-4"><ModeGuide mode="driver" /></div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-3"><span className="eyebrow">Current trip</span><span className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-mint-600"><span className="h-2 w-2 rounded-full bg-mint-500" />Active</span></div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink">Your trip is visible to passengers.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Test passenger matching now, or end this trip when the journey is complete. Ending it also completes its passenger bookings.</p>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1"><span className="h-3 w-3 rounded-full border-[3px] border-along-600 bg-white" /><span className="h-8 w-px bg-slate-300" /><span className="h-3 w-3 rounded-full bg-ink" /></div>
                <div className="min-w-0 flex-1 space-y-4 text-sm font-extrabold text-ink"><p>{activeTrip.origin.shortName}</p><p>{activeTrip.destination.shortName}</p></div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>Date<strong className="mt-1 block text-sm text-ink">{formatTripDate(activeTrip.departureTime)}</strong></span>
                <span>Leaves<strong className="mt-1 block text-sm text-ink">{formatTime(activeTrip.departureTime)}</strong></span>
                <span>Seats<strong className="mt-1 block text-sm text-ink">{activeTrip.availableSeats}/{activeTrip.totalSeats}</strong></span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-along-50 p-4 text-xs leading-5 text-along-700"><strong className="block text-sm text-ink">What happens next?</strong><ol className="mt-2 list-decimal space-y-1 pl-4"><li>Switch to passenger mode to test matching.</li><li>Passengers can compare and book this trip.</li><li>End the trip after arrival to release passengers and publish again.</li></ol></div>
            {activeTrips.length > 1 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-700">{activeTrips.length} active records were found for this driver. Ending the trip will close all duplicate active records.</p>}
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
            <button onClick={() => onNavigate('search')} className="btn-primary mt-6 w-full">Test as passenger <ArrowRight className="h-4 w-4" /></button>
            <button onClick={handleComplete} disabled={completing} className="btn-secondary mt-3 w-full text-slate-600">{completing ? <><LoaderCircle className="h-4 w-4 animate-spin" />Ending trip…</> : <><CheckCircle2 className="h-4 w-4" />End trip and create a new one</>}</button>
          </section>
          <div className="space-y-4">
            <div className="relative">
              <MapPanel origin={activeTrip.origin} destination={activeTrip.destination} route={activeRoute ?? undefined} title={`${user.name}'s road route`} />
              {activeRouteLoading && <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-card"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Loading road route…</div>}
            </div>
            {activeRoute && <div className="grid grid-cols-3 gap-3"><RouteStat label="Road distance" value={formatDistance(activeRoute.distanceMeters)} /><RouteStat label="Driving time" value={formatDuration(activeRoute.durationSeconds)} /><RouteStat label="Max detour" value={`${activeTrip.maxDetourMinutes} min`} /></div>}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink"><ArrowLeft className="h-4 w-4" />Back</button>
      <div className="mt-4"><ModeGuide mode="driver" /></div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[440px_1fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-card">
          <span className="eyebrow">Driver trip</span><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink">Where are you already going?</h1><p className="mt-2 text-sm leading-6 text-slate-500">Publish your planned journey. Along only suggests passengers who fit your direction and detour limit.</p>
          <div className="mt-7 space-y-5"><LocationInput label="From" value={origin} onChange={setOrigin} /><LocationInput label="To" value={destination} onChange={setDestination} />
            <div className="grid grid-cols-2 gap-3"><InputField label="Date" icon={Calendar}><input type="date" value={date} min={todayISO()} onChange={(event) => setDate(event.target.value)} className="field pl-10" /></InputField><InputField label="Departure" icon={Clock3}><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="field pl-10" /></InputField></div>
            <div className="grid grid-cols-2 gap-3"><InputField label="Available seats" icon={Users}><select value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="field pl-10">{[1, 2, 3, 4].map((number) => <option key={number}>{number}</option>)}</select></InputField><InputField label="Max detour" icon={Gauge}><select value={detour} onChange={(event) => setDetour(Number(event.target.value))} className="field pl-10">{[5, 10, 15, 20, 30, 35, 45, 60].map((number) => <option value={number} key={number}>{number} min</option>)}</select></InputField></div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button onClick={handlePublish} disabled={!route || publishing} className="btn-primary mt-7 w-full py-3.5">{publishing ? <><LoaderCircle className="h-4 w-4 animate-spin" />Publishing…</> : <>Publish trip <ArrowRight className="h-4 w-4" /></>}</button>
          <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">This draft stays private until you press Publish. Choose up to 60 minutes for longer cross-city trips.</p>
        </section>
        <div className="space-y-4"><MapPanel origin={origin} destination={destination} route={route ?? undefined} title="Your planned route" />
          <div className="grid grid-cols-3 gap-3">{calculating ? <div className="col-span-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Calculating route…</div> : route && <><RouteStat label="Distance" value={formatDistance(route.distanceMeters)} /><RouteStat label="Driving time" value={formatDuration(route.durationSeconds)} /><RouteStat label="Arrival" value={`~${formatTime(addMinutes(combineDateTime(date, time), route.durationSeconds / 60))}`} /></>}</div>
          <div className="rounded-2xl border border-mint-100 bg-mint-50 p-4 text-sm leading-6 text-mint-600"><strong>Driver-first matching:</strong> passenger requests are checked against your existing trip. Your route is never created on demand.</div>
        </div>
      </div>
    </main>
  )
}

function InputField({ label, icon: Icon, children }: { label: string; icon: typeof Calendar; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span><div className="relative"><Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />{children}</div></label> }
function RouteStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p><strong className="mt-1 block text-base text-ink">{value}</strong></div> }
function formatTripDate(dateTime: string) { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(dateTime)) }
