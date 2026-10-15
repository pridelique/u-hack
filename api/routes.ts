import type { VercelRequest, VercelResponse } from '@vercel/node'
import { computeGoogleRoute, isValidRoutePoints, RoutesApiError } from '../server/googleRoutes.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' })
  if (!process.env.GOOGLE_ROUTES_API_KEY) return response.status(503).json({ error: 'Routing is not configured' })
  const points = request.body?.points
  if (!isValidRoutePoints(points)) return response.status(400).json({ error: 'Invalid route points' })

  try {
    return response.status(200).json(await computeGoogleRoute(points, process.env.GOOGLE_ROUTES_API_KEY))
  } catch (error) {
    const status = error instanceof RoutesApiError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Route calculation failed'
    return response.status(status).json({ error: message })
  }
}
