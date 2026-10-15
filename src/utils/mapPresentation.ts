import type { Location, MatchResult } from '../types'

export const MAP_COLORS = {
  driver: '#7C3AED',
  passenger: '#059669',
  pickupRoute: '#EA580C',
  comparedDriver: '#BE185D',
} as const

export interface MapStopLabel {
  label: string
  location: Location
  kind: 'driver' | 'passenger'
}

export interface MapStop {
  lat: number
  lng: number
  labels: MapStopLabel[]
}

export function getMapStops(origin?: Location, destination?: Location, match?: MatchResult | null): MapStop[] {
  const candidates: Array<{ label: string; location?: Location; kind: MapStopLabel['kind'] }> = match
    ? [
        { label: 'Driver start', location: match.trip.origin, kind: 'driver' },
        { label: 'Driver end', location: match.trip.destination, kind: 'driver' },
        { label: 'Pickup', location: match.pickup, kind: 'passenger' },
        { label: 'Drop-off', location: match.dropoff, kind: 'passenger' },
      ]
    : [
        { label: 'Start', location: origin, kind: 'driver' },
        { label: 'End', location: destination, kind: 'driver' },
      ]

  const stops: MapStop[] = []
  for (const { location, ...label } of candidates) {
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) continue
    // Combine roles at the same coordinate, without shifting either stop on the map.
    const existing = stops.find((stop) => stop.lat === location.lat && stop.lng === location.lng)
    if (existing) existing.labels.push({ ...label, location })
    else stops.push({ lat: location.lat, lng: location.lng, labels: [{ ...label, location }] })
  }
  return stops
}

export function createMapStopIcon(stop: MapStop): HTMLElement {
  const icon = document.createElement('div')
  icon.className = 'along-map-stop'
  icon.title = stop.labels.map(({ label, location }) => `${label}: ${location.shortName}`).join('\n')
  icon.setAttribute('aria-label', icon.title)
  const dot = document.createElement('span')
  dot.className = 'along-map-stop-dot'
  dot.style.background = stop.labels.some(({ kind }) => kind === 'passenger') ? MAP_COLORS.passenger : MAP_COLORS.driver
  icon.appendChild(dot)

  for (const kind of ['driver', 'passenger'] as const) {
    const labels = stop.labels.filter((label) => label.kind === kind)
    if (!labels.length) continue
    const stack = document.createElement('span')
    stack.className = `along-map-stop-labels along-map-stop-labels-${kind}`
    for (const { label } of labels) {
      const badge = document.createElement('span')
      badge.className = 'along-map-stop-label'
      badge.style.color = MAP_COLORS[kind]
      badge.textContent = label
      stack.appendChild(badge)
    }
    icon.appendChild(stack)
  }
  return icon
}
