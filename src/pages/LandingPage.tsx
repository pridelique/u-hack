import { ArrowDownRight, ArrowRight, CarFront, Check, MapPin, Route, Search, ShieldCheck, Users } from 'lucide-react'
import type { AppPage } from '../types'

export function LandingPage({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  return (
    <main>
      <section className="landing-container grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
        <div className="min-w-0">
          <p className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-ember-500" />Made for the everyday journey / Bangkok</p>
          <h1 className="landing-title mt-6 font-display font-normal text-ink">Same direction.<br /><span className="italic text-along-500">Better together.</span></h1>
          <p className="mt-6 max-w-[390px] text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">Someone’s already heading your way. Find a seat, share the journey, and make a little less traffic.</p>
          <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row">
            <button onClick={() => onNavigate('search')} className="btn-primary gap-8 px-6 py-3">Find a ride <ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => onNavigate('publish')} className="btn-secondary gap-3 bg-transparent px-6 py-3"><CarFront className="h-4 w-4" />Publish a trip</button>
          </div>
          <div className="mt-9 flex max-w-[390px] items-start gap-3 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-along-600" />
            <p>Meet a verified demo driver. Compare routes, check the detour, and choose who you travel with.</p>
          </div>
        </div>
        <JourneyIllustration />
      </section>

      <section className="landing-container">
        <div className="grid gap-4 border-y border-slate-200 py-6 text-xs text-slate-600 sm:grid-cols-3 sm:gap-8 sm:py-7">
          <span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-along-600" />Verified demo drivers</span>
          <span className="flex items-center gap-3"><Route className="h-4 w-4 text-along-600" />Routes that fit your day</span>
          <span className="flex items-center gap-3"><Users className="h-4 w-4 text-along-600" />A seat in a trip already happening</span>
        </div>
      </section>

      <section className="landing-container py-14 sm:py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="eyebrow">A small change to your commute</p><h2 className="mt-3 font-display text-4xl font-normal leading-tight sm:text-5xl">Your route. A little company.</h2></div>
          <p className="max-w-[280px] text-sm leading-6 text-slate-500">For the driver already on the road and the passenger going the same way.</p>
        </div>
        <div className="mt-9 grid gap-0 border-t border-slate-200 md:grid-cols-3">
          <HowStep number="01" icon={CarFront} title="Already on your way?" text="Publish your trip, available seats, and the extra time you’re comfortable with." />
          <HowStep number="02" icon={Search} title="Find your shared route." text="Choose where and when. We’ll look for published trips that fit your journey." />
          <HowStep number="03" icon={Users} title="Choose your company." text="Compare drivers, look over the route, and book one available seat." />
        </div>
      </section>

      <section className="bg-ink text-[#F7F6F0]">
        <div className="landing-container grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-24">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#B9CAB0]">A shared way forward</p><h2 className="mt-4 max-w-xl font-display text-4xl font-normal leading-tight sm:text-5xl">One less empty seat.<br /><span className="italic text-[#C8D4B4]">One more good connection.</span></h2></div>
          <div><p className="max-w-md text-sm leading-7 text-[#D0D8C8]">Along brings people into journeys that are already happening. A familiar road, a nearby pickup, and someone headed in the same direction.</p><button onClick={() => onNavigate('search')} className="mt-6 inline-flex min-h-12 items-center gap-8 border-b border-[#A9B7A1] pb-2 text-sm font-medium text-white hover:border-white">See who’s going your way <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      </section>
    </main>
  )
}

function JourneyIllustration() {
  return (
    <figure className="relative min-w-0 overflow-hidden rounded-2xl border border-[#DADFD0] bg-[#ECEEE2]">
      <figcaption className="flex items-center justify-between gap-3 border-b border-[#DADFD0] px-5 py-4 sm:px-7"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">City connections</span><span className="text-[10px] text-slate-500">BKK / 13.75° N, 100.50° E</span></figcaption>
      <div className="relative">
        <svg viewBox="0 0 520 390" className="block w-full" role="img" aria-label="Illustrated shared journey between Samyan and Kasetsart. Schematic, not a live map.">
          <g fill="none" stroke="#D6DCCC" strokeWidth="1.3">
            <path d="M-20 75H180L310 205H540M-30 320H135L265 190V-20M65-20V135L-20 220M405-20V105L520 220M80 410V300L210 170H540M-20 165H105L350 410M335-20V70L520 255M-10 260H175L300 385M455-20V70L270 255V410M-10 360H95L415 40H540" />
          </g>
          <path d="M-20 40C115 40 25 185 130 220S120 350 220 410" fill="none" stroke="#D0D9CB" strokeWidth="22" />
          <path d="M66 335H142Q164 335 164 313V255Q164 235 184 235H244Q265 235 265 214V145Q265 124 286 124H340Q360 124 360 103V45" fill="none" stroke="#B4C1A5" strokeWidth="12" strokeLinecap="round" />
          <path d="M164 295V255Q164 235 184 235H244Q265 235 265 214V145Q265 124 286 124H340" fill="none" stroke="#315940" strokeWidth="12" strokeLinecap="round" />
          <path d="M164 295V255Q164 235 184 235H244Q265 235 265 214V145Q265 124 286 124H340" fill="none" stroke="#F7F6F0" strokeWidth="1.5" strokeDasharray="3 8" />
          <g fill="#F7F6F0" stroke="#315940" strokeWidth="3"><circle cx="164" cy="295" r="8" /><circle cx="340" cy="124" r="8" /></g>
          <g fill="#315940" fontFamily="DM Sans, sans-serif"><text x="184" y="301" fontSize="13" fontWeight="700">Samyan</text><text x="340" y="101" textAnchor="middle" fontSize="13" fontWeight="700">Kasetsart</text></g>
          <g fill="#7F8C76" fontFamily="DM Sans, sans-serif" fontSize="10"><text x="184" y="318">Your pickup</text><text x="340" y="85" textAnchor="middle">Your destination</text><text x="31" y="69" letterSpacing="2" transform="rotate(-65 31 69)">CHAO PHRAYA</text><text x="299" y="324" letterSpacing="2">BANGKOK</text></g>
          <g transform="translate(242 174) rotate(-45)"><rect x="-15" y="-22" width="30" height="44" rx="11" fill="#BD7752" stroke="#F7F6F0" strokeWidth="4" /><rect x="-9" y="-10" width="18" height="15" rx="4" fill="#EBD6BC" /><path d="M-9 11H9" stroke="#EBD6BC" strokeWidth="3" strokeLinecap="round" /></g>
          <g transform="translate(440 290)" stroke="#7F8C76" fill="none"><path d="M0 30V0M-5 6L0 0L5 6" /><text x="0" y="-9" textAnchor="middle" fill="#7F8C76" stroke="none" fontSize="10" fontFamily="DM Sans, sans-serif">N</text></g>
        </svg>
        <span className="absolute bottom-4 left-5 flex items-center gap-2 rounded-md bg-[#F7F6F0] px-2.5 py-1.5 text-[10px] text-slate-500"><MapPin className="h-3 w-3" />An example shared journey</span>
      </div>
      <div className="flex items-center gap-3 border-t border-[#DADFD0] bg-[#F5F5ED] px-5 py-4 sm:px-7"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#DCE4D2] text-xs font-semibold text-ink">NS</span><div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-xs font-semibold">Nicha S.<Check className="h-3 w-3 text-along-600" /></p><p className="mt-0.5 text-[10px] text-slate-500">Toyota Yaris · Demo driver</p></div><span className="flex items-center gap-2 text-xs text-along-600">Going your way <ArrowDownRight className="h-4 w-4" /></span></div>
    </figure>
  )
}

function HowStep({ number, icon: Icon, title, text }: { number: string; icon: typeof Search; title: string; text: string }) {
  return <div className="border-b border-slate-200 py-7 md:pr-8"><div className="flex items-center gap-3 text-slate-500"><span className="text-[11px] tabular-nums">{number}</span><span className="h-px w-8 bg-slate-300" /><Icon className="h-4 w-4 text-along-600" /></div><h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{text}</p></div>
}
