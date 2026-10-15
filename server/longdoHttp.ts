export interface LongdoRequestContext {
  origin?: string
  referer?: string
}

type HeaderValue = string | string[] | undefined

export class LongdoApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const firstHeader = (value: HeaderValue) => Array.isArray(value) ? value[0] : value

const safeHttpUrl = (value: string | undefined) => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

export const longdoRequestContextFromHeaders = (
  headers: Record<string, HeaderValue>,
): LongdoRequestContext => {
  const forwardedProto = firstHeader(headers['x-forwarded-proto'])?.split(',')[0]?.trim()
  const forwardedHost = firstHeader(headers['x-forwarded-host'])?.split(',')[0]?.trim()
  const host = forwardedHost || firstHeader(headers.host)
  const fallbackUrl = host ? `${forwardedProto || 'http'}://${host}/` : undefined

  return {
    origin: firstHeader(headers.origin) || fallbackUrl,
    referer: firstHeader(headers.referer) || fallbackUrl,
  }
}

export const longdoRequestHeaders = (context?: LongdoRequestContext) => {
  const referer = safeHttpUrl(context?.referer)
  const origin = safeHttpUrl(context?.origin) ?? referer
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (referer) headers.Referer = referer.toString()
  if (origin) headers.Origin = origin.origin
  return headers
}

export async function readLongdoJson<T>(response: Response, service: string): Promise<T> {
  const raw = await response.text()
  try {
    return JSON.parse(raw) as T
  } catch {
    if (/API Key Error/i.test(raw)) {
      throw new LongdoApiError(403, `Longdo ${service} rejected the API key or registered URL`)
    }
    throw new LongdoApiError(response.ok ? 502 : response.status, `Longdo ${service} returned an invalid response`)
  }
}
