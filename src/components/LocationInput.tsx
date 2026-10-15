import { useEffect, useId, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { LOCATIONS } from '../data/locations'
import { loadGoogleMaps } from '../services/googleMaps'
import type { Location } from '../types'

interface Props {
  label: string
  value: Location
  onChange: (location: Location) => void
}

const coordinate = (value: unknown) => {
  if (typeof value === 'function') return Number(value())
  return Number(value)
}

export function LocationInput({ label, value, onChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  const [fallback, setFallback] = useState(false)
  const listId = useId().replace(/:/g, '')

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    let cancelled = false
    let autocomplete: any
    let handleSelect: ((event: any) => Promise<void>) | undefined
    let handleError: (() => void) | undefined

    const setup = async () => {
      await loadGoogleMaps()
      const places = await window.google?.maps?.importLibrary('places')
      if (cancelled || !mountRef.current || !places?.PlaceAutocompleteElement) {
        if (!cancelled) setFallback(true)
        return
      }

      autocomplete = new places.PlaceAutocompleteElement({
        includedRegionCodes: ['th'],
        locationBias: { center: { lat: 13.7563, lng: 100.5018 }, radius: 200_000 },
        requestedLanguage: 'en',
        requestedRegion: 'th',
      })
      autocomplete.value = value.shortName
      autocomplete.placeholder = `Search ${label.toLowerCase()}`
      autocomplete.className = 'place-autocomplete'
      autocomplete.setAttribute('aria-label', label)

      handleSelect = async (event: any) => {
        try {
          const place = event.placePrediction?.toPlace()
          if (!place) return
          await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location'] })
          if (!place.location) return
          const lat = coordinate(place.location.lat)
          const lng = coordinate(place.location.lng)
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
          onChangeRef.current({
            name: place.formattedAddress ?? place.displayName ?? 'Selected location',
            shortName: place.displayName ?? place.formattedAddress ?? 'Selected location',
            lat,
            lng,
            placeId: place.id,
          })
        } catch {
          setFallback(true)
        }
      }
      handleError = () => setFallback(true)
      autocomplete.addEventListener('gmp-select', handleSelect)
      autocomplete.addEventListener('gmp-error', handleError)
      mountRef.current.replaceChildren(autocomplete)
      autocompleteRef.current = autocomplete
    }

    setup().catch(() => { if (!cancelled) setFallback(true) })
    return () => {
      cancelled = true
      if (autocomplete && handleSelect) autocomplete.removeEventListener('gmp-select', handleSelect)
      if (autocomplete && handleError) autocomplete.removeEventListener('gmp-error', handleError)
      if (autocompleteRef.current === autocomplete) autocompleteRef.current = null
      autocomplete?.remove()
    }
  }, [label])

  useEffect(() => {
    if (autocompleteRef.current && autocompleteRef.current.value !== value.shortName) {
      autocompleteRef.current.value = value.shortName
    }
  }, [value.placeId, value.shortName])

  const selectFallback = (text: string) => {
    const normalized = text.trim().toLowerCase()
    const match = LOCATIONS.find((location) => (
      location.shortName.toLowerCase() === normalized || location.name.toLowerCase() === normalized
    ))
    if (match) onChange(match)
  }

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {!fallback && <div ref={mountRef} className="place-autocomplete-host min-h-12" />}
      {fallback && <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          key={value.placeId}
          defaultValue={value.shortName}
          list={listId}
          onChange={(event) => selectFallback(event.target.value)}
          onBlur={(event) => {
            selectFallback(event.target.value)
            if (!LOCATIONS.some((location) => location.shortName.toLowerCase() === event.target.value.trim().toLowerCase())) {
              event.target.value = value.shortName
            }
          }}
          className="field pl-10"
          aria-label={label}
        />
        <datalist id={listId}>
          {LOCATIONS.map((location) => <option value={location.shortName} key={location.placeId} />)}
        </datalist>
        <p className="mt-1.5 text-[10px] font-semibold text-amber-700">Google Places unavailable — using saved Bangkok locations.</p>
      </div>}
    </label>
  )
}
