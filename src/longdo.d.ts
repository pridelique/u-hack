export {}

declare global {
  interface Window {
    longdo?: any
    __alongLongdoMapPromise?: Promise<unknown>
  }

  interface ImportMetaEnv {
    readonly VITE_LONGDO_MAP_API_KEY?: string
  }
}
