export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="Along">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-along-600 text-white shadow-sm">
        <span className="absolute h-4 w-1.5 -translate-x-1 rounded-full bg-white/95" />
        <span className="absolute h-4 w-1.5 translate-x-1 rounded-full bg-white/65" />
      </div>
      {!compact && <span className="text-xl font-extrabold tracking-[-0.04em] text-ink">along</span>}
    </div>
  )
}
