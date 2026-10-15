import { useEffect, useId, useRef, useState } from 'react'
import { LoaderCircle, MapPin } from 'lucide-react'
import { LOCATIONS } from '../data/locations'
import type { Location } from '../types'

interface Props {
  label: string
  value: Location
  onChange: (location: Location) => void
}

type PlaceOption = {
  id: string
  label: string
  secondary?: string
  location: Location
}

const savedOptions = (query: string): PlaceOption[] => {
  const normalized = query.trim().toLowerCase()
  return LOCATIONS
    .filter((location) => !normalized
      || location.shortName.toLowerCase().includes(normalized)
      || location.name.toLowerCase().includes(normalized))
    .slice(0, 5)
    .map((location) => ({
      id: location.placeId ?? location.shortName,
      label: location.shortName,
      secondary: location.name,
      location,
    }))
}

export function LocationInput({ label, value, onChange }: Props) {
  const listId = useId()
  const newestRequest = useRef(0)
  const [query, setQuery] = useState(value.shortName)
  const [options, setOptions] = useState<PlaceOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [placesUnavailable, setPlacesUnavailable] = useState(false)

  useEffect(() => { setQuery(value.shortName) }, [value.placeId, value.shortName])

  useEffect(() => {
    if (!open) return
    const local = savedOptions(query)
    const input = query.trim()

    if (input.length < 2) {
      setOptions(local)
      setLoading(false)
      return
    }

    const requestId = ++newestRequest.current
    const controller = new AbortController()
    setLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input }),
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Longdo place search is unavailable')
        const payload = await response.json() as { places?: PlaceOption[] }
        if (requestId !== newestRequest.current) return
        const remote = (payload.places ?? []).filter((option) => (
          option?.location
          && Number.isFinite(option.location.lat)
          && Number.isFinite(option.location.lng)
        ))
        const remoteIds = new Set(remote.map((option) => option.id))
        setOptions([...remote, ...local.filter((option) => !remoteIds.has(option.id))].slice(0, 6))
        setPlacesUnavailable(false)
      } catch {
        if (controller.signal.aborted || requestId !== newestRequest.current) return
        setOptions(local)
        setPlacesUnavailable(true)
      } finally {
        if (requestId === newestRequest.current) setLoading(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, query])

  const choose = (option: PlaceOption) => {
    onChange(option.location)
    setQuery(option.location.shortName)
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => Math.min(current + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault()
      choose(options[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setQuery(value.shortName)
    }
  }

  return (
    <label className="relative block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onFocus={() => { setOpen(true); setOptions(savedOptions(query)) }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1) }}
          onKeyDown={handleKeyDown}
          onBlur={() => window.setTimeout(() => {
            setOpen(false)
            setQuery(value.shortName)
          }, 150)}
          className="field pl-10 pr-10"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
        />
        {loading && <LoaderCircle className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-along-600" />}
      </div>

      {open && (options.length > 0 || placesUnavailable) && <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {options.map((option, index) => <button
          key={`${option.id}-${option.label}`}
          type="button"
          role="option"
          aria-selected={activeIndex === index}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(option)}
          className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 ${activeIndex === index ? 'bg-along-50' : 'hover:bg-slate-50'}`}
        >
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-along-600" />
          <span className="min-w-0"><strong className="block truncate text-sm text-ink">{option.label}</strong>{option.secondary && option.secondary !== option.label && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{option.secondary}</span>}</span>
        </button>)}
        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-400">
          <span>{placesUnavailable ? 'Saved locations — Longdo Search unavailable' : 'Search results'}</span>
          {!placesUnavailable && <span className="font-bold text-slate-500">Powered by Longdo</span>}
        </div>
      </div>}
    </label>
  )
}
