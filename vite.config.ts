import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { computeGoogleRoute, isValidRoutePoints, RoutesApiError } from './server/googleRoutes'

const localRoutesApi = (apiKey: string | undefined): Plugin => ({
  name: 'along-local-routes-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
      if (pathname !== '/api/routes') return next()

      response.setHeader('Content-Type', 'application/json')
      if (request.method !== 'POST') {
        response.statusCode = 405
        response.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }
      if (!apiKey) {
        response.statusCode = 503
        response.end(JSON.stringify({ error: 'Routing is not configured' }))
        return
      }

      try {
        let body = ''
        for await (const chunk of request) {
          body += chunk
          if (body.length > 20_000) throw new RoutesApiError(413, 'Request body is too large')
        }
        const points = (JSON.parse(body) as { points?: unknown }).points
        if (!isValidRoutePoints(points)) throw new RoutesApiError(400, 'Invalid route points')
        response.statusCode = 200
        response.end(JSON.stringify(await computeGoogleRoute(points, apiKey)))
      } catch (error) {
        response.statusCode = error instanceof RoutesApiError ? error.status : 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Route calculation failed' }))
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), localRoutesApi(env.GOOGLE_ROUTES_API_KEY)],
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
