export {}

declare global {
  interface Window {
    google?: any
    gm_authFailure?: () => void
    __alongGoogleMapsInit?: () => void
    __alongGoogleMapsPromise?: Promise<unknown>
    __alongGoogleMapsFailed?: boolean
  }
}
