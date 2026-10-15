import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Navigation, Route } from 'lucide-react'
import { loadLongdoMap } from '../services/longdoMap'
import { createMapStopIcon, getMapStops, MAP_COLORS } from '../utils/mapPresentation'
import type { Location, MatchResult, RouteSummary } from '../types'

interface Props {
  origin?: Location
  destination?: Location
  route?: RouteSummary
  match?: MatchResult | null
  secondaryMatch?: MatchResult | null
  title?: string
}

type MapPoint = { lat: number; lng: number }
type MapPath = { path: MapPoint[]; color: string; label: string; width: number }

const routePath = (route?: RouteSummary) => route?.source === 'longdo' ? route.path : []
const isMapPoint = (point: MapPoint | null | undefined): point is MapPoint => (
  Boolean(point) && Number.isFinite(point?.lat) && Number.isFinite(point?.lng)
)
const colorWithAlpha = (hex: string, alpha: number) => {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

export function MapPanel({ origin, destination, route, match, secondaryMatch, title = 'Route preview' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const [retryVersion, setRetryVersion] = useState(0)
  const failMapRef = useRef<() => void>(() => undefined)
  const paths = useMemo<MapPath[]>(() => {
    if (match && secondaryMatch) return [
      { path: routePath(match.modifiedRoute), color: MAP_COLORS.pickupRoute, label: `${match.driver.name} with pickup`, width: 7 },
      { path: routePath(secondaryMatch.modifiedRoute), color: MAP_COLORS.comparedDriver, label: `${secondaryMatch.driver.name} with pickup`, width: 6 },
    ]
    if (match) return [
      { path: routePath(match.modifiedRoute), color: MAP_COLORS.pickupRoute, label: `${match.driver.name} with pickup`, width: 7 },
      { path: routePath(match.passengerRoute), color: MAP_COLORS.passenger, label: 'Your journey', width: 4 },
    ]
    return route ? [{ path: routePath(route), color: MAP_COLORS.driver, label: 'Driver route', width: 6 }] : []
  }, [match, route, secondaryMatch])
  const unavailablePaths = paths.filter((item) => item.path.length < 2)

  useEffect(() => {
    let cancelled = false
    let map: any
    let timeout: number | undefined
    let resizeObserver: ResizeObserver | undefined
    // Longdo owns this node. React never reuses it for the fallback diagram.
    const placeholder = document.createElement('div')
    placeholder.className = 'absolute inset-0'
    // MapLibre's stylesheet also sets position, so keep the host dimensions explicit.
    Object.assign(placeholder.style, { position: 'absolute', width: '100%', height: '100%' })
    mapRef.current?.appendChild(placeholder)
    const dispose = () => {
      window.clearTimeout(timeout)
      resizeObserver?.disconnect()
      map?.Event?.unbind('ready', handleReady)
      placeholder.remove()
      try {
        map?.Renderer?.remove()
      } catch {
        // A partially initialized renderer may already have been released.
      }
      map = undefined
    }
    const handleMapsError = () => {
      if (cancelled) return
      cancelled = true
      dispose()
      setMapInstance(null)
      setMapFailed(true)
    }
    const handleReady = () => {
      if (cancelled) return
      window.clearTimeout(timeout)
      map.Event.unbind('ready', handleReady)
      map.Ui.Crosshair.visible(false)
      resizeObserver = new ResizeObserver(() => map?.Renderer?.resize())
      resizeObserver.observe(placeholder)
      setMapInstance(map)
    }
    failMapRef.current = handleMapsError
    setMapInstance(null)
    setMapFailed(false)

    loadLongdoMap().then(() => {
      if (cancelled || !window.longdo?.Map) return
      map = new window.longdo.Map({
        placeholder,
        location: { lat: 13.82, lon: 100.56 },
        zoom: 11,
        language: 'en',
        lastView: false,
      })
      map.Event.bind('ready', handleReady)
      timeout = window.setTimeout(handleMapsError, 20_000)
    }).catch(handleMapsError)

    return () => {
      cancelled = true
      dispose()
    }
  }, [retryVersion])

  useEffect(() => {
    if (!mapInstance) return
    const map = mapInstance
    try {
      map.Overlays.clear()
      const points = paths.flatMap((item) => item.path).filter(isMapPoint)
      paths.forEach((item) => {
        const path = item.path.filter(isMapPoint)
        if (path.length < 2) return
        const polyline = new window.longdo.Polyline(
          path.map((point) => ({ lat: point.lat, lon: point.lng })),
          {
            lineColor: colorWithAlpha(item.color, 0.95),
            lineWidth: item.width,
            title: item.label,
          },
        )
        map.Overlays.add(polyline)
      })

      const markers = getMapStops(origin, destination, match)

      markers.forEach((point) => {
        const icon = createMapStopIcon(point)
        const tooltip = document.createElement('span')
        tooltip.textContent = icon.title
        map.Overlays.add(new window.longdo.Marker(
          { lat: point.lat, lon: point.lng },
          {
            title: tooltip.outerHTML,
            icon: { html: icon.outerHTML, size: { width: 16, height: 16 }, offset: { x: 8, y: 8 } },
          },
        ))
      })

      const visiblePoints = [...points, ...markers]
      if (visiblePoints.length > 1) {
        map.bound({
          minLon: Math.min(...visiblePoints.map((point) => point.lng)),
          minLat: Math.min(...visiblePoints.map((point) => point.lat)),
          maxLon: Math.max(...visiblePoints.map((point) => point.lng)),
          maxLat: Math.max(...visiblePoints.map((point) => point.lat)),
        }, { padding: { top: 64, bottom: 56, left: 120, right: 120 }, maxZoom: 15, duration: 0 })
      } else if (visiblePoints[0]) {
        map.location({ lat: visiblePoints[0].lat, lon: visiblePoints[0].lng })
      }
    } catch {
      failMapRef.current()
    }
  }, [destination, mapInstance, match, origin, paths])

  return (<>
    <section className="map-shell relative overflow-hidden rounded-2xl bg-slate-100" aria-label={title}>
      <div ref={mapRef} className={`absolute inset-0 ${mapFailed ? 'invisible' : ''}`} aria-hidden={mapFailed} />
      {!mapInstance && !mapFailed && <div role="status" className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-500">Loading Longdo map…</div>}
      {mapFailed && <div key="fallback" className="absolute inset-0" aria-label={`${title} fallback diagram`}>
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(#cbd8df 1px, transparent 1px), linear-gradient(90deg, #cbd8df 1px, transparent 1px)', backgroundSize: '48px 48px', transform: 'rotate(-4deg) scale(1.15)' }} />
      <svg viewBox="0 0 700 480" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M35 410 C150 330 120 230 265 255 S430 180 665 55" fill="none" stroke="#CBD8DF" strokeWidth="34" strokeLinecap="round" />
        <path d="M35 410 C150 330 120 230 265 255 S430 180 665 55" fill="none" stroke="#fff" strokeWidth="22" strokeLinecap="round" strokeDasharray="2 7" />
        {match ? <>
          <path d="M60 390 C175 335 175 305 205 295 C250 250 315 230 390 195 C480 150 530 95 650 65" fill="none" stroke={MAP_COLORS.pickupRoute} strokeWidth="8" strokeLinecap="round" />
          {secondaryMatch
            ? <path d="M75 405 C160 345 190 290 230 282 S400 180 635 72" fill="none" stroke={MAP_COLORS.comparedDriver} strokeWidth="6" strokeLinecap="round" />
            : <path d="M205 295 C255 255 305 225 390 195 S505 132 565 105" fill="none" stroke={MAP_COLORS.passenger} strokeWidth="5" strokeLinecap="round" />}
          <circle cx="205" cy="295" r="10" fill={MAP_COLORS.passenger} stroke="#fff" strokeWidth="4" />
          <circle cx="565" cy="105" r="10" fill={MAP_COLORS.passenger} stroke="#fff" strokeWidth="4" />
        </> : <path d="M60 390 C190 320 155 220 285 245 S455 160 650 65" fill="none" stroke={MAP_COLORS.driver} strokeWidth="8" strokeLinecap="round" />}
        <circle cx="60" cy="390" r="12" fill={MAP_COLORS.driver} stroke="#fff" strokeWidth="5" />
        <circle cx="650" cy="65" r="12" fill="#10233F" stroke="#fff" strokeWidth="5" />
      </svg>
      <div className="absolute left-5 top-5 rounded-2xl bg-white/95 p-4 shadow-card backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-bold text-ink"><Navigation className="h-4 w-4 text-along-600" /> {title}</div>
        <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-500">Longdo map unavailable — showing a resilient route diagram.</p>
        <button type="button" onClick={() => setRetryVersion((version) => version + 1)} className="mt-3 text-xs font-bold text-along-600 hover:underline">Retry map</button>
      </div>
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-white/95 p-4 shadow-card">
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-along-600" /><span className="text-xs font-bold text-ink">{origin?.shortName ?? match?.trip.origin.shortName ?? 'Driver start'}</span></div>
        <Route className="h-4 w-4 text-slate-400" />
        <div className="flex items-center gap-2 text-right"><span className="text-xs font-bold text-ink">{destination?.shortName ?? match?.trip.destination.shortName ?? 'Driver destination'}</span><MapPin className="h-4 w-4 text-ink" /></div>
      </div>
      </div>}
    </section>
    <Legend paths={paths.filter((item) => item.path.length >= 2)} />
    {unavailablePaths.length > 0 && <p role="status" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
      Road route unavailable: {unavailablePaths.map((item) => item.label).join(', ')}. Straight-line estimates are hidden; distance and time may be estimates.
    </p>}
  </>)
}

function Legend({ paths }: { paths: Array<{ color: string; label: string }> }) {
  if (!paths.length) return null
  return (
    <div aria-label="Route legend" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white px-4 py-2">
      {paths.map((path) => <div key={path.label} className="flex items-center gap-2 py-1 text-[11px] font-semibold text-slate-600"><span className="h-1.5 w-5 rounded-full" style={{ backgroundColor: path.color }} />{path.label}</div>)}
    </div>
  )
}
