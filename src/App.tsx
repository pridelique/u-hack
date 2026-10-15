import { useEffect, useState } from 'react'
import { CarFront, Search } from 'lucide-react'
import { DemoBar } from './components/DemoBar'
import { Logo } from './components/Logo'
import { StatusPill } from './components/StatusPill'
import { demoUsers } from './data/demoUsers'
import { LandingPage } from './pages/LandingPage'
import { PublishPage } from './pages/PublishPage'
import { SearchPage } from './pages/SearchPage'
import { isLiveRoutingConfigured } from './services/routesService'
import { isDemoSeedTrip, loadTrips, resetDemo, subscribeToTrips } from './services/tripsService'
import type { AppPage, Trip, User } from './types'

export default function App() {
  const [page, setPage] = useState<AppPage>('home')
  const [user, setUser] = useState<User>(() => demoUsers.find((item) => item.id === localStorage.getItem('along-demo-user')) ?? demoUsers[4])
  const [trips, setTrips] = useState<Trip[]>([])
  const [storageMode, setStorageMode] = useState<'firebase' | 'demo'>('demo')
  const [resetNotice, setResetNotice] = useState(false)
  const [resetVersion, setResetVersion] = useState(0)

  useEffect(() => {
    let disposed = false
    let stopListening: () => void = () => undefined

    loadTrips().then(async (result) => {
      if (disposed) return
      setTrips(result.trips)
      setStorageMode(result.mode)
      if (result.mode === 'firebase') {
        const unsubscribe = await subscribeToTrips((liveTrips) => {
          if (!disposed) setTrips(liveTrips)
        })
        if (disposed) unsubscribe()
        else stopListening = unsubscribe
      }
    })

    return () => {
      disposed = true
      stopListening()
    }
  }, [])

  const rememberUser = (nextUser: User) => {
    setUser(nextUser)
    localStorage.setItem('along-demo-user', nextUser.id)
  }

  const navigate = (nextPage: AppPage) => {
    if (nextPage === 'search' && user.role !== 'passenger') rememberUser(demoUsers.find((item) => item.role === 'passenger') ?? demoUsers[4])
    if (nextPage === 'publish' && user.role !== 'driver') rememberUser(demoUsers.find((item) => item.role === 'driver') ?? demoUsers[0])
    setPage(nextPage)
  }

  const changeUser = (nextUser: User) => {
    rememberUser(nextUser)
    if (nextUser.role === 'driver') setPage('publish')
    else setPage('search')
  }

  const handleReset = async () => {
    const seeded = await resetDemo(); setTrips(seeded); setResetVersion((current) => current + 1); setResetNotice(true)
    window.setTimeout(() => setResetNotice(false), 2200)
  }

  return (
    <div className="app-shell min-h-screen bg-[#F7F6F0] text-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#F7F6F0]">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:h-[76px] sm:px-6 lg:px-10">
          <button onClick={() => navigate('home')} aria-label="Along home"><Logo /></button>
          <nav aria-label="Main navigation" className="ml-auto flex items-center gap-1">
            <button onClick={() => navigate('search')} aria-current={page === 'search' ? 'page' : undefined} className={`nav-button ${page === 'search' ? 'nav-button-active' : ''}`}><Search className="h-4 w-4" />Passenger</button>
            <button onClick={() => navigate('publish')} aria-current={page === 'publish' ? 'page' : undefined} className={`nav-button ${page === 'publish' ? 'nav-button-active' : ''}`}><CarFront className="h-4 w-4" />Driver</button>
          </nav>
          <span className="ml-5 hidden border-l border-slate-200 pl-6 text-xs text-slate-500 lg:block">A shared way through Bangkok.</span>
        </div>
        <div className="border-t border-slate-200 bg-[#EEEFE7]">
          <div className="mx-auto flex min-h-11 max-w-[1400px] items-center justify-between gap-5 px-4 py-1 sm:px-6 lg:px-10">
            <div className="hidden shrink-0 md:block"><StatusPill storageMode={storageMode} routingMode={isLiveRoutingConfigured() ? 'longdo' : 'demo'} /></div>
            <DemoBar user={user} users={demoUsers} onUserChange={changeUser} onReset={handleReset} />
          </div>
        </div>
      </header>

      {page === 'home' && <LandingPage onNavigate={navigate} />}
      {page === 'publish' && <PublishPage key={`${user.id}-${resetVersion}`} user={user.role === 'driver' ? user : demoUsers[0]} trips={trips} onNavigate={navigate} onPublished={(trip) => setTrips((current) => [trip, ...current.filter((item) => item.id !== trip.id)])} onTripsCompleted={(driverId) => setTrips((current) => current.map((trip) => trip.driverId === driverId && !isDemoSeedTrip(trip) && (trip.status === 'upcoming' || trip.status === 'full') ? { ...trip, status: 'completed' as const } : trip))} />}
      {page === 'search' && <SearchPage key={`${user.id}-${resetVersion}`} user={user.role === 'passenger' ? user : demoUsers[4]} trips={trips} onNavigate={navigate} onTripUpdate={(trip) => setTrips((current) => current.map((item) => item.id === trip.id ? trip : item))} />}

      {resetNotice && <div className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-2xl">Demo reset — drafts restored and published rides cleared.</div>}
      <footer className="mt-6 border-t border-slate-200 px-5 py-7"><div className="mx-auto flex max-w-[1300px] flex-col gap-3 text-[11px] leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p className="shrink-0 font-semibold text-ink">along / Bangkok · U-Hackathon prototype</p><p className="max-w-lg sm:text-right">Verification badges and route estimates are demo data unless live services are connected.</p></div></footer>
    </div>
  )
}
