import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { LOCATIONS } from '../data/locations'
import { loadGoogleMaps } from '../services/googleMaps'
import type { Location } from '../types'

interface Props {
  label: string
  value: Location
  onChange: (location: Location) => void
}

export function LocationInput({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let listener: { remove: () => void } | undefined
    loadGoogleMaps().then(() => {
      if (!inputRef.current || !window.google?.maps?.places) return
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['geometry', 'name', 'formatted_address', 'place_id'],
        componentRestrictions: { country: 'th' },
      })
      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const location = place.geometry?.location
        if (!location) return
        onChange({
          name: place.formatted_address ?? place.name ?? 'Selected location',
          shortName: place.name ?? place.formatted_address ?? 'Selected location',
          lat: location.lat(), lng: location.lng(), placeId: place.place_id,
        })
      })
    }).catch(() => undefined)
    return () => listener?.remove()
  }, [onChange])

  const handleBlur = () => {
    const text = inputRef.current?.value.trim().toLowerCase()
    if (!text) return
    const match = LOCATIONS.find((location) => location.shortName.toLowerCase() === text || location.name.toLowerCase() === text)
    if (match) onChange(match)
    else if (inputRef.current) inputRef.current.value = value.shortName
  }

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          key={value.placeId}
          defaultValue={value.shortName}
          list="along-locations"
          onBlur={handleBlur}
          className="field pl-10"
          aria-label={label}
        />
        <datalist id="along-locations">
          {LOCATIONS.map((location) => <option value={location.shortName} key={location.placeId} />)}
        </datalist>
      </div>
    </label>
  )
}
