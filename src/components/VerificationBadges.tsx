import { BadgeCheck, CarFront, ShieldCheck } from 'lucide-react'
import type { User } from '../types'

export function VerificationBadges({ user, compact = false }: { user: User; compact?: boolean }) {
  const badges = [
    { show: user.identityVerified, text: compact ? 'Identity' : 'Identity verified', icon: ShieldCheck },
    { show: user.driverVerified, text: compact ? 'Licence' : 'Driving licence', icon: BadgeCheck },
    { show: user.vehicleVerified, text: compact ? 'Vehicle' : 'Vehicle verified', icon: CarFront },
  ].filter((item) => item.show)

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {badges.map(({ text, icon: Icon }) => (
        <span key={text} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <Icon className="h-3.5 w-3.5 text-mint-600" /> {text}
        </span>
      ))}
    </div>
  )
}
