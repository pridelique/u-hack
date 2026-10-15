import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Navigation, Route } from 'lucide-react'
import type { Location, MatchResult, RouteSummary } from '../types'
import { loadGoogleMaps } from '../services/googleMaps'

interface Props {
  origin?: Location
  destination?: Location
  route?: RouteSummary
  match?: MatchResult | null
  secondaryMatch?: MatchResult | null
  title?: string
}

const decodePolyline = (encoded: string) => {
  const points: Array<{ lat: number; lng: number }> = []
  let index = 0; let lat = 0; let lng = 0
  while (index < encoded.length) {
    let result = 0; let shift = 0; let byte
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1
    result = 0; shift = 0
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

const routePath = (route?: RouteSummary) => route?.encodedPolyline ? decodePolyline(route.encodedPolyline) : route?.path ?? []

export function MapPanel({ origin, destination, route, match, secondaryMatch, title = 'Route preview' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(!import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
  const paths = useMemo(() => {
    if (match) return [
      { path: routePath(match.originalRoute), color: '#1677FF', label: `${match.driver.name}'s route` },
      { path: routePath(match.passengerRoute), color: '#10A976', label: 'Your journey' },
      { path: routePath(match.modifiedRoute), color: '#F58A3D', label: 'Route with pickup' },
      ...(secondaryMatch ? [{ path: routePath(secondaryMatch.modifiedRoute), color: '#8B5CF6', label: `${secondaryMatch.driver.name}'s route` }] : []),
    ]
    return route ? [{ path: routePath(route), color: '#1677FF', label: 'Driver route' }] : []
  }, [match, route, secondaryMatch])

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current || !window.google?.maps) return
      const points = paths.flatMap((item) => item.path)
      const center = points[0] ?? (origin ? { lat: origin.lat, lng: origin.lng } : { lat: 13.82, lng: 100.56 })
      const map = new window.google.maps.Map(mapRef.current, {
        center, zoom: 11, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
      })
      const bounds = new window.google.maps.LatLngBounds()
      paths.forEach((item, routeIndex) => {
        new window.google.maps.Polyline({
          map, path: item.path, strokeColor: item.color, strokeOpacity: routeIndex === 0 && match ? 0.45 : 0.95,
          strokeWeight: routeIndex === 2 ? 7 : 5,
        })
        item.path.forEach((point) => bounds.extend(point))
      })
      const markers = match
        ? [match.trip.origin, match.trip.destination, { ...match.passengerRoute.path[0], name: 'Pickup' }, { ...match.passengerRoute.path.at(-1), name: 'Drop-off' }]
        : [origin, destination]
      markers.filter(Boolean).forEach((point, index) => new window.google.maps.Marker({
        map, position: point, label: { text: String.fromCharCode(65 + index), color: '#fff', fontWeight: '700' },
      }))
      if (!bounds.isEmpty()) map.fitBounds(bounds, 56)
      setMapReady(true)
    }).catch(() => setMapFailed(true))
    return () => { cancelled = true }
  }, [destination, match, origin, paths])

  if (!mapFailed) return (
    <section className="map-shell relative min-h-[360px] overflow-hidden rounded-[28px] bg-slate-100">
      <div ref={mapRef} className="absolute inset-0" aria-label={title} />
      {!mapReady && <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-500">Loading map…</div>}
      <Legend paths={paths} />
    </section>
  )

  return (
    <section className="map-shell relative min-h-[360px] overflow-hidden rounded-[28px] bg-[#EAF1F5]" aria-label={`${title} fallback diagram`}>
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(#cbd8df 1px, transparent 1px), linear-gradient(90deg, #cbd8df 1px, transparent 1px)', backgroundSize: '48px 48px', transform: 'rotate(-4deg) scale(1.15)' }} />
      <svg viewBox="0 0 700 480" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M35 410 C150 330 120 230 265 255 S430 180 665 55" fill="none" stroke="#CBD8DF" strokeWidth="34" strokeLinecap="round" />
        <path d="M35 410 C150 330 120 230 265 255 S430 180 665 55" fill="none" stroke="#fff" strokeWidth="22" strokeLinecap="round" strokeDasharray="2 7" />
        {match ? <>
          <path d="M60 390 C190 320 155 220 285 245 S455 160 650 65" fill="none" stroke="#1677FF" strokeWidth="7" strokeLinecap="round" opacity=".65" />
          <path d="M205 295 C255 255 305 225 390 195 S505 132 565 105" fill="none" stroke="#10A976" strokeWidth="8" strokeLinecap="round" />
          <path d="M60 390 C175 335 175 305 205 295 C250 250 315 230 390 195 C480 150 530 95 650 65" fill="none" stroke="#F58A3D" strokeWidth="5" strokeDasharray="10 8" strokeLinecap="round" />
          {secondaryMatch && <path d="M75 405 C160 345 190 290 230 282 S400 180 635 72" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="7 8" />}
          <circle cx="205" cy="295" r="10" fill="#10A976" stroke="#fff" strokeWidth="4" />
          <circle cx="565" cy="105" r="10" fill="#10A976" stroke="#fff" strokeWidth="4" />
        </> : <path d="M60 390 C190 320 155 220 285 245 S455 160 650 65" fill="none" stroke="#1677FF" strokeWidth="8" strokeLinecap="round" />}
        <circle cx="60" cy="390" r="12" fill="#1677FF" stroke="#fff" strokeWidth="5" />
        <circle cx="650" cy="65" r="12" fill="#10233F" stroke="#fff" strokeWidth="5" />
      </svg>
      <div className="absolute left-5 top-5 rounded-2xl bg-white/95 p-4 shadow-card backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-bold text-ink"><Navigation className="h-4 w-4 text-along-600" /> {title}</div>
        <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-500">Map unavailable — showing a route diagram with demo estimates.</p>
      </div>
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-white/95 p-4 shadow-card">
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-along-600" /><span className="text-xs font-bold text-ink">{origin?.shortName ?? match?.trip.origin.shortName ?? 'Driver start'}</span></div>
        <Route className="h-4 w-4 text-slate-400" />
        <div className="flex items-center gap-2 text-right"><span className="text-xs font-bold text-ink">{destination?.shortName ?? match?.trip.destination.shortName ?? 'Driver destination'}</span><MapPin className="h-4 w-4 text-ink" /></div>
      </div>
      <Legend paths={paths} />
    </section>
  )
}

function Legend({ paths }: { paths: Array<{ color: string; label: string }> }) {
  if (!paths.length) return null
  return (
    <div className="absolute right-4 top-4 hidden rounded-xl border border-white/70 bg-white/95 p-3 shadow-card sm:block">
      {paths.map((path) => <div key={path.label} className="flex items-center gap-2 py-1 text-[11px] font-semibold text-slate-600"><span className="h-1.5 w-5 rounded-full" style={{ backgroundColor: path.color }} />{path.label}</div>)}
    </div>
  )
}
