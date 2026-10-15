import type { MatchResult, SearchInput, Trip, User } from '../types'
import { calculateRoute } from '../services/routesService'
import { addMinutes, toMinutes } from '../utils/time'
import { calculateRouteOverlap } from './routeOverlap'
import { compatibilityScore } from './compatibilityScore'
import { filterCandidates } from './candidateFilter'

const demoMetrics: Record<string, { overlap: number; detour: number; pickup: number }> = {
  'trip-nicha': { overlap: 88, detour: 3, pickup: 14 },
  'trip-arin': { overlap: 77, detour: 6, pickup: 15 },
  'trip-mali': { overlap: 83, detour: 5, pickup: 7 },
}

// Keep the live-routing budget predictable on Longdo's free tier. Cheap filters run first,
// then only the three strongest corridor candidates receive detailed road calculations.
const MAX_LIVE_ROUTE_CANDIDATES = 3

export const findMatches = async (trips: Trip[], users: User[], search: SearchInput): Promise<MatchResult[]> => {
  const candidates = filterCandidates(trips, users, search).slice(0, MAX_LIVE_ROUTE_CANDIDATES)
  if (!candidates.length) return []
  const passengerRoute = await calculateRoute([search.origin, search.destination])

  const matches = await Promise.all(candidates.map(async (trip): Promise<MatchResult | null> => {
    const driver = users.find((user) => user.id === trip.driverId)
    if (!driver) return null
    const originalRoute = trip.route?.source === 'longdo'
      ? trip.route
      : await calculateRoute([trip.origin, trip.destination])
    const modifiedRoute = await calculateRoute([trip.origin, search.origin, search.destination, trip.destination])
    const liveDetour = Math.max(0, Math.round((modifiedRoute.durationSeconds - originalRoute.durationSeconds) / 60))
    const preset = demoMetrics[trip.id]
    const isDemoEstimate = originalRoute.source === 'estimate' || modifiedRoute.source === 'estimate'
    const detourMinutes = isDemoEstimate && preset ? preset.detour : liveDetour
    const detourDistanceMeters = Math.max(0, modifiedRoute.distanceMeters - originalRoute.distanceMeters)
    if (detourMinutes > trip.maxDetourMinutes) return null

    const pickupOffset = isDemoEstimate && preset
      ? preset.pickup
      : Math.max(1, Math.round((modifiedRoute.legs?.[0]?.durationSeconds
        ?? (await calculateRoute([trip.origin, search.origin])).durationSeconds) / 60))
    const estimatedPickupTime = addMinutes(trip.departureTime, pickupOffset)
    const passengerMinutes = Math.round(passengerRoute.durationSeconds / 60)
    const estimatedArrivalTime = addMinutes(estimatedPickupTime, passengerMinutes)
    const preferred = `${search.date}T${search.preferredTime}:00+07:00`
    const timeDifferenceMinutes = toMinutes(estimatedPickupTime) - toMinutes(preferred)
    if (Math.abs(timeDifferenceMinutes) > 20) return null
    const routeOverlapPercent = isDemoEstimate && preset
      ? preset.overlap
      : calculateRouteOverlap(trip.origin, trip.destination, search.origin, search.destination)
    const score = compatibilityScore(detourMinutes, trip.maxDetourMinutes, routeOverlapPercent, timeDifferenceMinutes)

    return {
      pickup: search.origin, dropoff: search.destination,
      driver, trip, compatibilityScore: score, routeOverlapPercent, detourMinutes, detourDistanceMeters,
      estimatedPickupTime, estimatedArrivalTime, timeDifferenceMinutes, availableSeats: trip.availableSeats,
      originalRoute, modifiedRoute, passengerRoute,
      estimateSource: isDemoEstimate ? 'demo' : 'longdo',
    }
  }))

  return matches.filter((match): match is MatchResult => Boolean(match)).sort((a, b) => b.compatibilityScore - a.compatibilityScore)
}
