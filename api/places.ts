import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isValidPlaceQuery, searchLongdoPlaces } from '../server/longdoPlaces.js'
import { longdoRequestContextFromHeaders, LongdoApiError } from '../server/longdoHttp.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' })
  const apiKey = process.env.VITE_LONGDO_MAP_API_KEY
  if (!apiKey) return response.status(503).json({ error: 'Place search is not configured' })
  const query = request.body?.query
  if (!isValidPlaceQuery(query)) return response.status(400).json({ error: 'Invalid place query' })

  try {
    const context = longdoRequestContextFromHeaders(request.headers)
    return response.status(200).json({ places: await searchLongdoPlaces(query, apiKey, context) })
  } catch (error) {
    const status = error instanceof LongdoApiError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Place search failed'
    return response.status(status).json({ error: message })
  }
}
