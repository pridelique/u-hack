import type { Location, RouteSummary } from '../types'
import { estimateRoute } from '../utils/geo'

const cache = new Map<string, Promise<RouteSummary>>()

export const calculateRoute = async (points: Location[]): Promise<RouteSummary> => {
  const cacheKey = points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join('|')
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const request = (async () => {
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: points.map(({ lat, lng }) => ({ lat, lng })) }),
      })
      if (!response.ok) throw new Error('Live routing is unavailable')
      const route = await response.json() as RouteSummary
      if (route.source !== 'longdo'
        || !Number.isFinite(route.distanceMeters) || route.distanceMeters <= 0
        || !Number.isFinite(route.durationSeconds) || route.durationSeconds <= 0
        || !Array.isArray(route.path) || route.path.length < 2
        || !route.path.every((point) => point && Number.isFinite(point.lat) && Number.isFinite(point.lng))) {
        throw new Error('Live routing returned an invalid route')
      }
      return route
    } catch {
      return estimateRoute(points)
    }
  })()
  cache.set(cacheKey, request)
  // Share pending requests and successful road routes, but let the next explicit
  // search retry a failed request. Do not make automatic retry requests.
  void request.then((route) => {
    if (route.source === 'estimate' && cache.get(cacheKey) === request) cache.delete(cacheKey)
  })
  return request
}

export const isLiveRoutingConfigured = () => Boolean(import.meta.env.VITE_LONGDO_MAP_API_KEY)
