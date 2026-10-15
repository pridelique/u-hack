import {
  longdoRequestHeaders,
  LongdoApiError,
  readLongdoJson,
  type LongdoRequestContext,
} from './longdoHttp.js'

export interface RoutePoint {
  lat: number
  lng: number
}

interface LongdoRouteLeg {
  distanceMeters: number
  durationSeconds: number
  path: RoutePoint[]
}

interface GeoJsonGeometry {
  type?: 'LineString' | 'MultiLineString'
  coordinates?: number[][] | number[][][]
}

interface LongdoRouteFeatureCollection {
  meta?: { status?: number; message?: string }
  data?: { distance?: number; interval?: number } | Array<{ distance?: number; interval?: number }>
  features?: Array<{
    geometry?: GeoJsonGeometry
    properties?: { distance?: number; interval?: number }
  }>
  error?: string
  message?: string
}

type LongdoRouteResponse = LongdoRouteFeatureCollection | LongdoRouteFeatureCollection[]

const ROUTE_CACHE_TTL_MS = 10 * 60 * 1000
const ROUTE_CACHE_MAX_ENTRIES = 300
const routeCache = new Map<string, { expiresAt: number; value: Promise<LongdoRouteLeg> }>()

export const isValidRoutePoints = (value: unknown): value is RoutePoint[] => (
  Array.isArray(value)
  && value.length >= 2
  && value.length <= 6
  && value.every((point) => (
    typeof point === 'object'
    && point !== null
    && Number.isFinite((point as RoutePoint).lat)
    && Number.isFinite((point as RoutePoint).lng)
    && Math.abs((point as RoutePoint).lat) <= 90
    && Math.abs((point as RoutePoint).lng) <= 180
  ))
)

const segmentKey = (from: RoutePoint, to: RoutePoint) => (
  `${from.lat.toFixed(5)},${from.lng.toFixed(5)}>${to.lat.toFixed(5)},${to.lng.toFixed(5)}`
)

const pruneRouteCache = () => {
  const now = Date.now()
  for (const [key, entry] of routeCache) {
    if (entry.expiresAt <= now) routeCache.delete(key)
  }
  while (routeCache.size >= ROUTE_CACHE_MAX_ENTRIES) {
    const oldest = routeCache.keys().next().value as string | undefined
    if (!oldest) break
    routeCache.delete(oldest)
  }
}

const coordinatesFromGeometry = (geometry?: GeoJsonGeometry): RoutePoint[] => {
  if (!geometry?.coordinates) return []
  const lines = geometry.type === 'MultiLineString'
    ? geometry.coordinates as number[][][]
    : [geometry.coordinates as number[][]]

  return lines.flatMap((line) => line.flatMap((coordinate) => {
    const [lng, lat] = coordinate
    return Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng }] : []
  }))
}

const appendWithoutDuplicate = (target: RoutePoint[], points: RoutePoint[]) => {
  points.forEach((point) => {
    const previous = target.at(-1)
    if (!previous || previous.lat !== point.lat || previous.lng !== point.lng) target.push(point)
  })
}

const requestLongdoLeg = async (
  from: RoutePoint,
  to: RoutePoint,
  apiKey: string,
  context?: LongdoRequestContext,
): Promise<LongdoRouteLeg> => {
  const params = new URLSearchParams({
    flon: String(from.lng),
    flat: String(from.lat),
    tlon: String(to.lng),
    tlat: String(to.lat),
    mode: 't',
    type: '17',
    restrict: '0',
    locale: 'en',
    maxresult: '1',
    key: apiKey,
  })
  const response = await fetch(`https://api.longdo.com/RouteService/geojson/route?${params}`, {
    headers: longdoRequestHeaders(context),
    signal: AbortSignal.timeout(15_000),
  })
  const payload = await readLongdoJson<LongdoRouteResponse>(response, 'Route')
  const data = Array.isArray(payload) ? payload[0] : payload
  if (!data) throw new LongdoApiError(502, 'Longdo Route returned no routes')
  const serviceStatus = Number(data.meta?.status)
  if (!response.ok || (Number.isFinite(serviceStatus) && serviceStatus >= 400)) {
    throw new LongdoApiError(response.ok ? serviceStatus : response.status, data.meta?.message ?? data.message ?? data.error ?? 'Longdo Route request failed')
  }

  const routeData = Array.isArray(data.data) ? data.data[0] : data.data
  const featureDistance = data.features?.reduce((total, feature) => total + Number(feature.properties?.distance ?? 0), 0) ?? 0
  const featureDuration = data.features?.reduce((total, feature) => total + Number(feature.properties?.interval ?? 0), 0) ?? 0
  const distanceMeters = Number(routeData?.distance ?? featureDistance)
  const durationSeconds = Number(routeData?.interval ?? featureDuration)
  const path: RoutePoint[] = []
  data.features?.forEach((feature) => appendWithoutDuplicate(path, coordinatesFromGeometry(feature.geometry)))

  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new LongdoApiError(502, 'Longdo Route returned an incomplete route')
  }
  if (path.length < 2) throw new LongdoApiError(502, 'Longdo Route returned no road geometry')

  return { distanceMeters, durationSeconds, path }
}

const getLongdoLeg = (from: RoutePoint, to: RoutePoint, apiKey: string, context?: LongdoRequestContext) => {
  const key = segmentKey(from, to)
  const cached = routeCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  pruneRouteCache()
  const value = requestLongdoLeg(from, to, apiKey, context).catch((error) => {
    routeCache.delete(key)
    throw error
  })
  routeCache.set(key, { expiresAt: Date.now() + ROUTE_CACHE_TTL_MS, value })
  return value
}

export async function computeLongdoRoute(points: RoutePoint[], apiKey: string, context?: LongdoRequestContext) {
  const legs = await Promise.all(points.slice(1).map((point, index) => getLongdoLeg(points[index], point, apiKey, context)))
  const path: RoutePoint[] = []
  legs.forEach((leg) => appendWithoutDuplicate(path, leg.path))

  return {
    distanceMeters: legs.reduce((total, leg) => total + leg.distanceMeters, 0),
    durationSeconds: legs.reduce((total, leg) => total + leg.durationSeconds, 0),
    path,
    legs,
    source: 'longdo' as const,
  }
}
