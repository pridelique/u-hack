import type { Trip } from '../types'
import { locationById } from './locations'
import { estimateRoute } from '../utils/geo'
import { combineDateTime, todayISO } from '../utils/time'

const DRIVER_DRAFTS = {
  'driver-nicha': { originId: 'demo-chula', destinationId: 'demo-future-park', time: '17:00', seats: 3, maxDetourMinutes: 35 },
  'driver-arin': { originId: 'demo-siam', destinationId: 'demo-tu-rangsit', time: '17:05', seats: 2, maxDetourMinutes: 35 },
  'driver-mali': { originId: 'demo-ari', destinationId: 'demo-future-park', time: '17:12', seats: 2, maxDetourMinutes: 45 },
  'driver-krit': { originId: 'demo-bangna', destinationId: 'demo-chonburi', time: '17:00', seats: 2, maxDetourMinutes: 20 },
} as const

export const getDemoDriverDraft = (driverId: string) => {
  const definition = DRIVER_DRAFTS[driverId as keyof typeof DRIVER_DRAFTS] ?? DRIVER_DRAFTS['driver-nicha']
  return {
    origin: locationById(definition.originId),
    destination: locationById(definition.destinationId),
    time: definition.time,
    seats: definition.seats,
    maxDetourMinutes: definition.maxDetourMinutes,
  }
}

export const createDemoTrips = (): Trip[] => {
  const date = todayISO()
  return Object.entries(DRIVER_DRAFTS).map(([driverId, definition]) => {
    const origin = locationById(definition.originId)
    const destination = locationById(definition.destinationId)
    const route = estimateRoute([origin, destination])
    return {
      id: `trip-${driverId.replace('driver-', '')}`, driverId, origin, destination, departureTime: combineDateTime(date, definition.time),
      totalSeats: definition.seats, availableSeats: definition.seats, maxDetourMinutes: definition.maxDetourMinutes,
      baselineDistanceMeters: route.distanceMeters, baselineDurationSeconds: route.durationSeconds,
      status: 'draft', createdAt: new Date().toISOString(), isDemoSeed: true, route,
    }
  })
}
