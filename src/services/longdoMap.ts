const SCRIPT_ID = 'along-longdo-map-script'

export const loadLongdoMap = () => {
  const key = import.meta.env.VITE_LONGDO_MAP_API_KEY
  if (!key) return Promise.reject(new Error('Longdo Map is not configured'))
  if (window.longdo?.Map) return Promise.resolve(window.longdo)
  if (window.__alongLongdoMapPromise) return window.__alongLongdoMapPromise

  const promise = new Promise((resolve, reject) => {
    let settled = false
    const script = (document.getElementById(SCRIPT_ID)
      ?? document.querySelector('script[src^="https://api.longdo.com/map3/"]')) as HTMLScriptElement | null
      ?? document.createElement('script')
    const timeout = window.setTimeout(() => fail(new Error('Longdo Map timed out while loading')), 15_000)
    const cleanup = () => {
      window.clearTimeout(timeout)
      script.removeEventListener('load', finish)
      script.removeEventListener('error', handleError)
    }
    const finish = () => {
      if (settled) return
      if (!window.longdo?.Map) {
        fail(new Error('Longdo Map loaded without the Map API'))
        return
      }
      settled = true
      cleanup()
      resolve(window.longdo)
    }
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      script.remove()
      reject(error)
    }
    const handleError = () => fail(new Error('Longdo Map failed to load'))

    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (script.isConnected) return

    script.id = SCRIPT_ID
    script.src = `https://api.longdo.com/map3/?key=${encodeURIComponent(key)}`
    script.async = true
    document.head.appendChild(script)
  })

  window.__alongLongdoMapPromise = promise
  void promise.catch(() => {
    if (window.__alongLongdoMapPromise === promise) window.__alongLongdoMapPromise = undefined
  })
  return promise
}
