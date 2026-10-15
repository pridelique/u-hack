export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="Along">
      <svg viewBox="0 0 36 36" className="h-8 w-8 text-along-600 sm:h-9 sm:w-9" fill="none" aria-hidden="true">
        <path d="M7 28V16a7 7 0 0 1 14 0v12M15 28V16a7 7 0 0 1 14 0v12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M7 23h8m6 0h8" stroke="currentColor" strokeWidth="3.5" />
      </svg>
      {!compact && <span className="text-[27px] font-semibold tracking-[-0.065em] text-ink sm:text-[30px]">along<span className="text-ember-500">.</span></span>}
    </div>
  )
}
