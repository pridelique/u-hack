import {
  longdoRequestHeaders,
  LongdoApiError,
  readLongdoJson,
  type LongdoRequestContext,
} from './longdoHttp.js'

interface LongdoSearchItem {
  type?: string
  id?: string | number
  name?: string
  address?: string
  lat?: number | string
  lon?: number | string
}

interface LongdoSearchResponse {
  data?: LongdoSearchItem[]
  meta?: { status?: number; message?: string }
  error?: string
  message?: string
}

export interface LongdoPlaceOption {
  id: string
  label: string
  secondary?: string
  location: {
    name: string
    shortName: string
    lat: number
    lng: number
    placeId: string
  }
}

const PLACE_CACHE_TTL_MS = 5 * 60 * 1000
const PLACE_CACHE_MAX_ENTRIES = 100
const placeCache = new Map<string, { expiresAt: number; value: LongdoPlaceOption[] }>()

export const isValidPlaceQuery = (value: unknown): value is string => (
  typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 120
)

const prunePlaceCache = () => {
  const now = Date.now()
  for (const [key, entry] of placeCache) {
    if (entry.expiresAt <= now) placeCache.delete(key)
  }
  while (placeCache.size >= PLACE_CACHE_MAX_ENTRIES) {
    const oldest = placeCache.keys().next().value as string | undefined
    if (!oldest) break
    placeCache.delete(oldest)
  }
}

export async function searchLongdoPlaces(query: string, apiKey: string, context?: LongdoRequestContext) {
  const normalized = `th|${query.trim().toLocaleLowerCase('th')}`
  const cached = placeCache.get(normalized)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const params = new URLSearchParams({
    keyword: query.trim(),
    lon: '100.5018',
    lat: '13.7563',
    limit: '6',
    locale: 'th',
    key: apiKey,
  })
  const response = await fetch(`https://search.longdo.com/mapsearch/json/search?${params}`, {
    headers: longdoRequestHeaders(context),
    signal: AbortSignal.timeout(10_000),
  })
  const data = await readLongdoJson<LongdoSearchResponse>(response, 'Search')
  const serviceStatus = Number(data.meta?.status)
  if (!response.ok || (Number.isFinite(serviceStatus) && serviceStatus >= 400)) {
    throw new LongdoApiError(response.ok ? serviceStatus : response.status, data.meta?.message ?? data.message ?? data.error ?? 'Longdo Search request failed')
  }

  const seen = new Set<string>()
  const places: LongdoPlaceOption[] = (data.data ?? []).flatMap((item) => {
    const lat = Number(item.lat)
    const lng = Number(item.lon)
    const name = item.name?.trim()
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return []
    const id = `longdo:${item.type ?? 'place'}:${item.id ?? `${lat},${lng}`}`
    const dedupeKey = `${name.toLocaleLowerCase('th')}|${lat.toFixed(5)}|${lng.toFixed(5)}`
    if (seen.has(dedupeKey)) return []
    seen.add(dedupeKey)
    return [{
      id,
      label: name,
      secondary: item.address?.trim() || undefined,
      location: {
        name: item.address?.trim() || name,
        shortName: name,
        lat,
        lng,
        placeId: id,
      },
    }]
  }).slice(0, 6)

  prunePlaceCache()
  placeCache.set(normalized, { expiresAt: Date.now() + PLACE_CACHE_TTL_MS, value: places })
  return places
}
