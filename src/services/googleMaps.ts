const SCRIPT_ID = 'along-google-maps-script'
const MAPS_ERROR_EVENT = 'along:google-maps-error'

export const googleMapsErrorEvent = MAPS_ERROR_EVENT

export const loadGoogleMaps = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return Promise.reject(new Error('Google Maps is not configured'))
  if (window.__alongGoogleMapsFailed) return Promise.reject(new Error('Google Maps is unavailable in this page session'))
  if (window.google?.maps) return Promise.resolve(window.google)
  if (window.__alongGoogleMapsPromise) return window.__alongGoogleMapsPromise

  window.__alongGoogleMapsPromise = new Promise((resolve, reject) => {
    let settled = false
    const finish = () => {
      if (settled) return
      if (!window.google?.maps) {
        fail(new Error('Google Maps loaded without the Maps API'))
        return
      }
      settled = true
      window.__alongGoogleMapsFailed = false
      resolve(window.google)
    }
    const fail = (error: Error) => {
      window.__alongGoogleMapsFailed = true
      window.dispatchEvent(new Event(MAPS_ERROR_EVENT))
      if (settled) return
      settled = true
      window.__alongGoogleMapsPromise = undefined
      reject(error)
    }

    const previousAuthFailure = window.gm_authFailure
    window.gm_authFailure = () => {
      previousAuthFailure?.()
      fail(new Error('Google Maps rejected the browser API key'))
    }
    window.__alongGoogleMapsInit = finish

    const existingScript = (document.getElementById(SCRIPT_ID)
      ?? document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]')) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', finish, { once: true })
      existingScript.addEventListener('error', () => fail(new Error('Google Maps failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly&loading=async&callback=__alongGoogleMapsInit`
    script.async = true
    script.onerror = () => fail(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })

  return window.__alongGoogleMapsPromise
}
