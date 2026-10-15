import type { Location, RouteSummary } from '../types'
import { estimateRoute } from '../utils/geo'

const cache = new Map<string, RouteSummary>()

export const calculateRoute = async (points: Location[]): Promise<RouteSummary> => {
  const cacheKey = points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join('|')
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: points.map(({ lat, lng }) => ({ lat, lng })) }),
    })
    if (!response.ok) throw new Error('Live routing is unavailable')
    const route = await response.json() as RouteSummary
    route.source = 'google'
    cache.set(cacheKey, route)
    return route
  } catch {
    const route = estimateRoute(points)
    cache.set(cacheKey, route)
    return route
  }
}

export const isLiveRoutingConfigured = () => Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
