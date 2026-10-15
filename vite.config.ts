import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { isValidPlaceQuery, searchLongdoPlaces } from './server/longdoPlaces'
import { computeLongdoRoute, isValidRoutePoints } from './server/longdoRoutes'
import { longdoRequestContextFromHeaders, LongdoApiError } from './server/longdoHttp'

const localLongdoApi = (apiKey: string | undefined): Plugin => ({
  name: 'along-local-longdo-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
      if (pathname !== '/api/routes' && pathname !== '/api/places') return next()

      response.setHeader('Content-Type', 'application/json')
      if (request.method !== 'POST') {
        response.statusCode = 405
        response.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }
      if (!apiKey) {
        response.statusCode = 503
        response.end(JSON.stringify({ error: pathname === '/api/routes' ? 'Routing is not configured' : 'Place search is not configured' }))
        return
      }

      try {
        let body = ''
        for await (const chunk of request) {
          body += chunk
          if (body.length > 20_000) throw new LongdoApiError(413, 'Request body is too large')
        }
        let payload: { points?: unknown; query?: unknown }
        try {
          payload = JSON.parse(body) as { points?: unknown; query?: unknown }
        } catch {
          throw new LongdoApiError(400, 'Invalid JSON body')
        }
        const context = longdoRequestContextFromHeaders(request.headers)

        if (pathname === '/api/routes') {
          if (!isValidRoutePoints(payload.points)) throw new LongdoApiError(400, 'Invalid route points')
          response.statusCode = 200
          response.end(JSON.stringify(await computeLongdoRoute(payload.points, apiKey, context)))
          return
        }

        if (!isValidPlaceQuery(payload.query)) throw new LongdoApiError(400, 'Invalid place query')
        response.statusCode = 200
        response.end(JSON.stringify({ places: await searchLongdoPlaces(payload.query, apiKey, context) }))
      } catch (error) {
        response.statusCode = error instanceof LongdoApiError ? error.status : 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Longdo request failed' }))
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), localLongdoApi(env.VITE_LONGDO_MAP_API_KEY)],
    server: { host: '127.0.0.1', port: 3000, strictPort: true },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase'
            if (id.includes('node_modules/lucide-react')) return 'icons'
            if (id.includes('node_modules/react')) return 'react-vendor'
          },
        },
      },
    },
  }
})
