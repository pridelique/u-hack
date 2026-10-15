import { RotateCcw, UserRound } from 'lucide-react'
import type { User } from '../types'

export function DemoBar({ user, users, onUserChange, onReset }: { user: User; users: User[]; onUserChange: (user: User) => void; onReset: () => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 md:ml-auto md:flex-initial">
      <div className="hidden shrink-0 items-center gap-2 text-[11px] text-slate-500 sm:flex"><UserRound className="h-3.5 w-3.5" />Test as</div>
      <select aria-label="Test as user" value={user.id} onChange={(event) => onUserChange(users.find((item) => item.id === event.target.value) ?? users[0])} className="h-10 min-w-0 flex-1 truncate rounded-lg border-0 bg-transparent py-2 pr-2 text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-along-100 sm:max-w-[240px]">
        {users.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.role}</option>)}
      </select>
      <button onClick={onReset} className="ml-auto inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-slate-500 hover:bg-white hover:text-ink"><RotateCcw className="h-3.5 w-3.5" />Reset demo</button>
    </div>
  )
}
