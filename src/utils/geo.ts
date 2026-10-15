import type { Location, RouteSummary } from '../types'

const EARTH_RADIUS_KM = 6371
const radians = (value: number) => value * Math.PI / 180

export const distanceKm = (a: Pick<Location, 'lat' | 'lng'>, b: Pick<Location, 'lat' | 'lng'>) => {
  const dLat = radians(b.lat - a.lat)
  const dLng = radians(b.lng - a.lng)
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export const directionDot = (originA: Location, destinationA: Location, originB: Location, destinationB: Location) => {
  const ax = destinationA.lng - originA.lng
  const ay = destinationA.lat - originA.lat
  const bx = destinationB.lng - originB.lng
  const by = destinationB.lat - originB.lat
  const length = Math.hypot(ax, ay) * Math.hypot(bx, by)
  return length ? (ax * bx + ay * by) / length : 0
}

export const distanceToSegmentKm = (point: Location, start: Location, end: Location) => {
  const scale = Math.cos(radians(point.lat))
  const px = point.lng * scale; const py = point.lat
  const ax = start.lng * scale; const ay = start.lat
  const bx = end.lng * scale; const by = end.lat
  const dx = bx - ax; const dy = by - ay
  const length = dx * dx + dy * dy
  const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0
  const projected = { lat: ay + t * dy, lng: (ax + t * dx) / scale, name: '', shortName: '' }
  return distanceKm(point, projected)
}

export const estimateRoute = (points: Location[]): RouteSummary => {
  let kilometers = 0
  for (let index = 1; index < points.length; index += 1) kilometers += distanceKm(points[index - 1], points[index])
  const roadFactor = 1.16
  const distanceMeters = Math.round(kilometers * roadFactor * 1000)
  const durationSeconds = Math.round((kilometers * roadFactor / 38) * 3600 + Math.max(0, points.length - 2) * 90)
  return {
    distanceMeters,
    durationSeconds,
    path: points.map(({ lat, lng }) => ({ lat, lng })),
    source: 'estimate',
  }
}

export const overlapPercent = (driverOrigin: Location, driverDestination: Location, passengerOrigin: Location, passengerDestination: Location) => {
  const direction = directionDot(driverOrigin, driverDestination, passengerOrigin, passengerDestination)
  if (direction < 0.15) return 0
  const originDistance = distanceToSegmentKm(passengerOrigin, driverOrigin, driverDestination)
  const destinationDistance = distanceToSegmentKm(passengerDestination, driverOrigin, driverDestination)
  const corridorPenalty = Math.min(70, (originDistance + destinationDistance) * 5.5)
  return Math.max(0, Math.round(98 - corridorPenalty - (1 - direction) * 18))
}
