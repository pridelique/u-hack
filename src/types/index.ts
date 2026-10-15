export type Gender = 'female' | 'male' | 'unknown'
export type TripStatus = 'draft' | 'upcoming' | 'full' | 'cancelled' | 'completed'
export type AppPage = 'home' | 'publish' | 'search'

export interface Location {
  name: string
  shortName: string
  lat: number
  lng: number
  placeId?: string
}

export interface User {
  id: string
  name: string
  initials: string
  gender: Gender
  role: 'driver' | 'passenger'
  phoneVerified: boolean
  identityVerified: boolean
  driverVerified: boolean
  vehicleVerified: boolean
  vehicleName?: string
  vehiclePlateMasked?: string
  accent: string
}

export interface RouteSummary {
  distanceMeters: number
  durationSeconds: number
  encodedPolyline?: string
  path: Array<{ lat: number; lng: number }>
  source: 'google' | 'estimate'
}

export interface Trip {
  id: string
  driverId: string
  origin: Location
  destination: Location
  departureTime: string
  totalSeats: number
  availableSeats: number
  maxDetourMinutes: number
  baselineDistanceMeters: number
  baselineDurationSeconds: number
  status: TripStatus
  createdAt: string
  isDemoSeed?: boolean
  route?: RouteSummary
}

export interface Booking {
  id: string
  tripId: string
  driverId: string
  passengerId: string
  pickup: Location
  dropoff: Location
  estimatedPickupTime: string
  estimatedArrivalTime: string
  detourMinutes: number
  detourDistanceMeters: number
  routeOverlapPercent: number
  compatibilityScore: number
  requestedSeats: number
  status: 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
  demoSessionId?: string
}

export interface SearchInput {
  origin: Location
  destination: Location
  date: string
  preferredTime: string
  womenOnly: boolean
}

export interface MatchResult {
  driver: User
  trip: Trip
  compatibilityScore: number
  routeOverlapPercent: number
  detourMinutes: number
  detourDistanceMeters: number
  estimatedPickupTime: string
  estimatedArrivalTime: string
  timeDifferenceMinutes: number
  availableSeats: number
  originalRoute: RouteSummary
  modifiedRoute: RouteSummary
  passengerRoute: RouteSummary
  estimateSource: 'google' | 'demo'
}
