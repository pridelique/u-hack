import { ArrowRight, CarFront, Check, Clock3, GitCompareArrows, MapPin, Route, Search, ShieldCheck, Sparkles, Users } from 'lucide-react'
import type { AppPage } from '../types'

export function LandingPage({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-5 py-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
        <div>
          <div className="eyebrow"><span className="h-2 w-2 rounded-full bg-mint-500" /> Bangkok · seats already moving</div>
          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[74px]">
            Already going<br />that way? <span className="text-along-600">Go together.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Find verified drivers who are already traveling in your direction and share the ride with minimal detour.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => onNavigate('search')} className="btn-primary px-6 py-3.5">Find a ride <ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => onNavigate('publish')} className="btn-secondary px-6 py-3.5"><CarFront className="h-4 w-4" />Publish a trip</button>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-mint-600" />Verified demo drivers</span>
            <span className="inline-flex items-center gap-2"><Route className="h-4 w-4 text-along-600" />Detour-aware matching</span>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-ember-600" />Seats update instantly</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-10 -top-10 h-52 w-52 rounded-full bg-along-100/70 blur-3xl" />
          <div className="absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-mint-100/70 blur-3xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-white bg-white p-5 shadow-soft sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Example after publish</p><p className="mt-1 text-lg font-black text-ink">Samyan → Kasetsart</p></div><span className="rounded-full bg-mint-50 px-3 py-2 text-sm font-black text-mint-600">90% match</span></div>
            <div className="relative mt-6 h-52 overflow-hidden rounded-[24px] bg-[#EAF1F5]">
              <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(#cbd8df 1px, transparent 1px), linear-gradient(90deg, #cbd8df 1px, transparent 1px)', backgroundSize: '38px 38px', transform: 'rotate(-5deg) scale(1.2)' }} />
              <svg viewBox="0 0 520 210" className="absolute inset-0 h-full w-full" aria-hidden="true"><path d="M20 175 C100 140 120 55 220 95 S350 145 500 25" fill="none" stroke="#1677FF" strokeWidth="7" strokeLinecap="round" opacity=".45" /><path d="M125 118 C210 75 245 112 325 105 S410 62 455 48" fill="none" stroke="#10A976" strokeWidth="9" strokeLinecap="round" /><path d="M20 175 C95 145 110 125 125 118 C205 73 250 115 325 105 C410 91 440 50 500 25" fill="none" stroke="#F58A3D" strokeWidth="4" strokeDasharray="8 7" /><circle cx="125" cy="118" r="9" fill="#10A976" stroke="white" strokeWidth="4" /><circle cx="455" cy="48" r="9" fill="#10A976" stroke="white" strokeWidth="4" /></svg>
              <div className="absolute bottom-3 left-3 rounded-xl bg-white/95 px-3 py-2 text-[10px] font-bold text-slate-500 shadow"><span className="mr-2 inline-block h-1.5 w-5 rounded-full bg-mint-500" />Your journey</div>
            </div>
            <div className="mt-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#7165E8] text-sm font-black text-white">NS</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><strong className="text-sm text-ink">Nicha S.</strong><Check className="h-3.5 w-3.5 text-mint-600" /></div><p className="text-xs text-slate-500">Toyota Yaris · Demo verified</p></div><span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-ink">3 seats</span></div>
            <div className="mt-5 grid grid-cols-3 gap-2"><MiniStat icon={Route} label="Overlap" value="88%" color="text-mint-600" /><MiniStat icon={Clock3} label="Detour" value="+31 min" color="text-ember-600" /><MiniStat icon={MapPin} label="Pickup" value="~17:07" color="text-along-600" /></div>
          </div>
          <div className="absolute -right-3 top-24 hidden rounded-2xl border border-white bg-white p-3 shadow-card sm:flex sm:items-center sm:gap-2"><Sparkles className="h-4 w-4 text-along-600" /><span className="text-xs font-extrabold text-ink">Within driver’s limit</span></div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="max-w-xl"><span className="eyebrow">How it works</span><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink">One clear flow for both sides.</h2></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <HowStep number="1" icon={CarFront} title="Driver publishes" text="Share a trip you already plan to make, including seats and maximum detour." />
            <HowStep number="2" icon={Search} title="Passenger searches" text="Enter pickup, destination, and time. Along checks real road routes." />
            <HowStep number="3" icon={GitCompareArrows} title="Compare and book" text="Compare two matching drivers, preview the routes, then book one seat." />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:grid-cols-2 lg:px-8">
          <div className="rounded-[28px] bg-slate-100 p-7"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Traditional ride-hailing</p><p className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-500">Find someone to make a trip for you.</p></div>
          <div className="rounded-[28px] bg-ink p-7 text-white"><p className="text-xs font-black uppercase tracking-[0.16em] text-along-100">Along</p><p className="mt-4 text-2xl font-black tracking-[-0.03em]">Find someone already making that trip.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 text-center lg:px-8"><span className="eyebrow">One less empty seat</span><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] text-ink sm:text-5xl">We don’t create another trip.<br /><span className="text-along-600">We fill empty seats</span> in trips already happening.</h2><button onClick={() => onNavigate('search')} className="btn-primary mt-8 px-6 py-3.5">See who’s going your way <ArrowRight className="h-4 w-4" /></button></section>
    </main>
  )
}

function MiniStat({ icon: Icon, label, value, color }: { icon: typeof Route; label: string; value: string; color: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400"><Icon className="h-3 w-3" />{label}</div><strong className={`mt-1 block text-sm ${color}`}>{value}</strong></div>
}

function HowStep({ number, icon: Icon, title, text }: { number: string; icon: typeof Search; title: string; text: string }) {
  return <div className="rounded-[24px] border border-slate-200 bg-[#F7F9FC] p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-along-600 shadow-sm"><Icon className="h-5 w-5" /></span><span className="text-xs font-black text-slate-300">0{number}</span></div><h3 className="mt-5 text-lg font-black text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>
}
