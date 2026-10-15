import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock3, Gauge, LoaderCircle, Users } from 'lucide-react'
import { LocationInput } from '../components/LocationInput'
import { MapPanel } from '../components/MapPanel'
import { LOCATIONS } from '../data/locations'
import { calculateRoute } from '../services/routesService'
import { publishTrip } from '../services/tripsService'
import type { AppPage, RouteSummary, Trip, User } from '../types'
import { addMinutes, combineDateTime, formatDistance, formatDuration, formatTime, todayISO } from '../utils/time'

export function PublishPage({ user, onNavigate, onPublished }: { user: User; onNavigate: (page: AppPage) => void; onPublished: (trip: Trip) => void }) {
  const [origin, setOrigin] = useState(LOCATIONS[0])
  const [destination, setDestination] = useState(LOCATIONS[1])
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('17:00')
  const [seats, setSeats] = useState(3)
  const [detour, setDetour] = useState(8)
  const [route, setRoute] = useState<RouteSummary | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  useEffect(() => {
    let active = true
    setCalculating(true)
    calculateRoute([origin, destination]).then((result) => active && setRoute(result)).finally(() => active && setCalculating(false))
    return () => { active = false }
  }, [destination, origin])

  const handlePublish = async () => {
    if (!route) return
    setPublishing(true)
    const trip: Trip = {
      id: `trip-${user.id}-${Date.now()}`,
      driverId: user.role === 'driver' ? user.id : 'driver-nicha',
      origin, destination, departureTime: combineDateTime(date, time),
      totalSeats: seats, availableSeats: seats, maxDetourMinutes: detour,
      baselineDistanceMeters: route.distanceMeters, baselineDurationSeconds: route.durationSeconds,
      status: 'upcoming', createdAt: new Date().toISOString(), route,
    }
    await publishTrip(trip)
    onPublished(trip)
    setPublishing(false)
    setPublished(true)
  }

  if (published) return <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-2xl place-items-center px-5 py-12"><div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-soft"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-50 text-mint-600"><CheckCircle2 className="h-8 w-8" /></div><h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-ink">Your trip is live.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Passengers traveling in the same direction can find it immediately. You’ll accept up to {detour} minutes of detour.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => onNavigate('search')} className="btn-primary px-6">Test passenger search <ArrowRight className="h-4 w-4" /></button><button onClick={() => setPublished(false)} className="btn-secondary px-6">Publish another</button></div></div></main>

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink"><ArrowLeft className="h-4 w-4" />Back</button>
      <div className="mt-5 grid gap-6 lg:grid-cols-[440px_1fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-card">
          <span className="eyebrow">Driver trip</span><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink">Where are you already going?</h1><p className="mt-2 text-sm leading-6 text-slate-500">Publish your planned journey. Along only suggests passengers who fit your direction and detour limit.</p>
          <div className="mt-7 space-y-5"><LocationInput label="From" value={origin} onChange={setOrigin} /><LocationInput label="To" value={destination} onChange={setDestination} />
            <div className="grid grid-cols-2 gap-3"><InputField label="Date" icon={Calendar}><input type="date" value={date} min={todayISO()} onChange={(event) => setDate(event.target.value)} className="field pl-10" /></InputField><InputField label="Departure" icon={Clock3}><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="field pl-10" /></InputField></div>
            <div className="grid grid-cols-2 gap-3"><InputField label="Available seats" icon={Users}><select value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="field pl-10">{[1, 2, 3, 4].map((number) => <option key={number}>{number}</option>)}</select></InputField><InputField label="Max detour" icon={Gauge}><select value={detour} onChange={(event) => setDetour(Number(event.target.value))} className="field pl-10">{[5, 8, 10, 15].map((number) => <option value={number} key={number}>{number} min</option>)}</select></InputField></div>
          </div>
          <button onClick={handlePublish} disabled={!route || publishing} className="btn-primary mt-7 w-full py-3.5">{publishing ? <><LoaderCircle className="h-4 w-4 animate-spin" />Publishing…</> : <>Publish trip <ArrowRight className="h-4 w-4" /></>}</button>
          <p className="mt-3 text-center text-[11px] text-slate-400">Visible to demo passengers immediately.</p>
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
