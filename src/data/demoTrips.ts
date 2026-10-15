import type { Trip } from '../types'
import { locationById } from './locations'
import { estimateRoute } from '../utils/geo'
import { combineDateTime, todayISO } from '../utils/time'

export const createDemoTrips = (): Trip[] => {
  const date = todayISO()
  const definitions = [
    ['trip-nicha', 'driver-nicha', 'demo-chula', 'demo-future-park', '17:00', 3, 8],
    ['trip-arin', 'driver-arin', 'demo-siam', 'demo-tu-rangsit', '17:05', 2, 10],
    ['trip-mali', 'driver-mali', 'demo-ari', 'demo-future-park', '17:12', 2, 9],
    ['trip-krit', 'driver-krit', 'demo-bangna', 'demo-chonburi', '17:00', 2, 12],
  ] as const

  return definitions.map(([id, driverId, originId, destinationId, time, seats, maxDetourMinutes]) => {
    const origin = locationById(originId)
    const destination = locationById(destinationId)
    const route = estimateRoute([origin, destination])
    return {
      id, driverId, origin, destination, departureTime: combineDateTime(date, time),
      totalSeats: seats, availableSeats: seats, maxDetourMinutes,
      baselineDistanceMeters: route.distanceMeters, baselineDurationSeconds: route.durationSeconds,
      status: 'upcoming', createdAt: new Date().toISOString(), route,
    }
  })
}
