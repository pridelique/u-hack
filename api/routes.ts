import type { VercelRequest, VercelResponse } from '@vercel/node'
import { computeLongdoRoute, isValidRoutePoints } from '../server/longdoRoutes.js'
import { longdoRequestContextFromHeaders, LongdoApiError } from '../server/longdoHttp.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' })
  const apiKey = process.env.VITE_LONGDO_MAP_API_KEY
  if (!apiKey) return response.status(503).json({ error: 'Routing is not configured' })
  const points = request.body?.points
  if (!isValidRoutePoints(points)) return response.status(400).json({ error: 'Invalid route points' })

  try {
    const context = longdoRequestContextFromHeaders(request.headers)
    return response.status(200).json(await computeLongdoRoute(points, apiKey, context))
  } catch (error) {
    const status = error instanceof LongdoApiError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Route calculation failed'
    return response.status(status).json({ error: message })
  }
}
