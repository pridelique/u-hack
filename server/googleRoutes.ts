export interface RoutePoint {
  lat: number
  lng: number
}

export class RoutesApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

export const isValidRoutePoints = (value: unknown): value is RoutePoint[] => (
  Array.isArray(value)
  && value.length >= 2
  && value.length <= 6
  && value.every((point) => (
    typeof point === 'object'
    && point !== null
    && Number.isFinite((point as RoutePoint).lat)
    && Number.isFinite((point as RoutePoint).lng)
  ))
)

export async function computeGoogleRoute(points: RoutePoint[], apiKey: string) {
  const [origin, ...rest] = points
  const destination = rest.at(-1)!
  const intermediates = rest.slice(0, -1).map((point) => ({
    location: { latLng: { latitude: point.lat, longitude: point.lng } },
  }))

  const routesResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      intermediates,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'METRIC',
    }),
  })

  if (!routesResponse.ok) throw new RoutesApiError(routesResponse.status, 'Google Routes request failed')
  const data = await routesResponse.json() as {
    routes?: Array<{ distanceMeters: number; duration: string; polyline?: { encodedPolyline?: string } }>
  }
  const route = data.routes?.[0]
  if (!route) throw new RoutesApiError(404, 'No route found')

  return {
    distanceMeters: route.distanceMeters,
    durationSeconds: Number.parseFloat(route.duration),
    encodedPolyline: route.polyline?.encodedPolyline,
    path: points,
    source: 'google' as const,
  }
}
