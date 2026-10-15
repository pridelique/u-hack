import type { VercelRequest, VercelResponse } from '@vercel/node'

interface RoutePoint { lat: number; lng: number }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' })
  if (!process.env.GOOGLE_ROUTES_API_KEY) return response.status(503).json({ error: 'Routing is not configured' })
  const points = request.body?.points as RoutePoint[] | undefined
  if (!Array.isArray(points) || points.length < 2 || points.length > 6) return response.status(400).json({ error: 'Invalid route points' })

  const [origin, ...rest] = points
  const destination = rest.at(-1)!
  const intermediates = rest.slice(0, -1).map((point) => ({
    location: { latLng: { latitude: point.lat, longitude: point.lng } },
  }))

  const routesResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_ROUTES_API_KEY,
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

  if (!routesResponse.ok) return response.status(routesResponse.status).json({ error: 'Google Routes request failed' })
  const data = await routesResponse.json() as { routes?: Array<{ distanceMeters: number; duration: string; polyline?: { encodedPolyline?: string } }> }
  const route = data.routes?.[0]
  if (!route) return response.status(404).json({ error: 'No route found' })
  return response.status(200).json({
    distanceMeters: route.distanceMeters,
    durationSeconds: Number.parseFloat(route.duration),
    encodedPolyline: route.polyline?.encodedPolyline,
    path: points,
    source: 'google',
  })
}
