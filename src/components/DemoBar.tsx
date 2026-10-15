import { RotateCcw, UserRound } from 'lucide-react'
import type { User } from '../types'

export function DemoBar({ user, users, onUserChange, onReset }: { user: User; users: User[]; onUserChange: (user: User) => void; onReset: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-2 pl-2 text-xs font-bold text-slate-500"><UserRound className="h-4 w-4" /> Test as</div>
      <select aria-label="Test as user" value={user.id} onChange={(event) => onUserChange(users.find((item) => item.id === event.target.value) ?? users[0])} className="rounded-xl border-0 bg-slate-100 px-3 py-2 text-xs font-extrabold text-ink outline-none focus:ring-4 focus:ring-along-50">
        {users.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.role}</option>)}
      </select>
      <button onClick={onReset} className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-ink"><RotateCcw className="h-3.5 w-3.5" />Reset demo</button>
    </div>
  )
}
