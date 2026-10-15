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
import { loadTrips, resetDemo } from './services/tripsService'
import type { AppPage, Trip, User } from './types'

export default function App() {
  const [page, setPage] = useState<AppPage>('home')
  const [user, setUser] = useState<User>(() => demoUsers.find((item) => item.id === localStorage.getItem('along-demo-user')) ?? demoUsers[4])
  const [trips, setTrips] = useState<Trip[]>([])
  const [storageMode, setStorageMode] = useState<'firebase' | 'demo'>('demo')
  const [resetNotice, setResetNotice] = useState(false)

  useEffect(() => { loadTrips().then((result) => { setTrips(result.trips); setStorageMode(result.mode) }) }, [])

  const changeUser = (nextUser: User) => {
    setUser(nextUser); localStorage.setItem('along-demo-user', nextUser.id)
    if (nextUser.role === 'driver') setPage('publish')
    else setPage('search')
  }

  const handleReset = async () => {
    const seeded = await resetDemo(); setTrips(seeded); setResetNotice(true)
    window.setTimeout(() => setResetNotice(false), 2200)
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#F7F9FC]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 lg:px-8">
          <button onClick={() => setPage('home')} aria-label="Along home"><Logo /></button>
          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            <button onClick={() => setPage('search')} className={`nav-button ${page === 'search' ? 'nav-button-active' : ''}`}><Search className="h-4 w-4" />Find a ride</button>
            <button onClick={() => setPage('publish')} className={`nav-button ${page === 'publish' ? 'nav-button-active' : ''}`}><CarFront className="h-4 w-4" />Publish trip</button>
          </nav>
          <div className="hidden xl:block"><StatusPill storageMode={storageMode} routingMode={isLiveRoutingConfigured() ? 'google' : 'demo'} /></div>
          <div className="hidden md:block"><DemoBar user={user} users={demoUsers.filter((item) => item.id === 'driver-nicha' || item.role === 'passenger')} onUserChange={changeUser} onReset={handleReset} /></div>
          <div className="ml-auto flex gap-2 sm:hidden"><button onClick={() => setPage('search')} className="icon-button" aria-label="Find a ride"><Search className="h-5 w-5" /></button><button onClick={() => setPage('publish')} className="icon-button" aria-label="Publish a trip"><CarFront className="h-5 w-5" /></button></div>
        </div>
        <div className="border-t border-slate-200 px-4 py-2 md:hidden"><DemoBar user={user} users={demoUsers.filter((item) => item.id === 'driver-nicha' || item.role === 'passenger')} onUserChange={changeUser} onReset={handleReset} /></div>
      </header>

      {page === 'home' && <LandingPage onNavigate={setPage} />}
      {page === 'publish' && <PublishPage user={user.role === 'driver' ? user : demoUsers[0]} onNavigate={setPage} onPublished={(trip) => setTrips((current) => [trip, ...current.filter((item) => item.id !== trip.id)])} />}
      {page === 'search' && <SearchPage user={user.role === 'passenger' ? user : demoUsers[4]} trips={trips} onNavigate={setPage} onTripUpdate={(trip) => setTrips((current) => current.map((item) => item.id === trip.id ? trip : item))} />}

      {resetNotice && <div className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-2xl">Demo restored — seats and bookings reset.</div>}
      <footer className="border-t border-slate-200 bg-white px-5 py-7"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><p>Along · U-Hackathon prototype</p><p>Verification badges and route estimates are demo data unless live services are connected.</p></div></footer>
    </div>
  )
}
