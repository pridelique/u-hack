import type { SearchInput, Trip, User } from '../types'
import { directionDot, distanceToSegmentKm } from '../utils/geo'
import { toMinutes } from '../utils/time'

export const filterCandidates = (trips: Trip[], users: User[], search: SearchInput) => trips.filter((trip) => {
  const driver = users.find((user) => user.id === trip.driverId)
  if (!driver?.driverVerified || trip.isDemoSeed || trip.status !== 'upcoming' || trip.availableSeats < 1) return false
  if (trip.departureTime.slice(0, 10) !== search.date) return false
  if (search.womenOnly && driver.gender !== 'female') return false
  if (Math.abs(toMinutes(trip.departureTime) - toMinutes(`${search.date}T${search.preferredTime}:00`)) > 45) return false
  if (directionDot(trip.origin, trip.destination, search.origin, search.destination) < 0.05) return false
  const corridorDistance = distanceToSegmentKm(search.origin, trip.origin, trip.destination)
    + distanceToSegmentKm(search.destination, trip.origin, trip.destination)
  return corridorDistance < 18
})
