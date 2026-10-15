import {
  collection, doc, getDocs, onSnapshot, runTransaction, writeBatch,
} from 'firebase/firestore'
import { createDemoTrips } from '../data/demoTrips'
import type { Booking, MatchResult, Trip } from '../types'
import { getFirebaseDb } from './firebase'

const TRIPS_KEY = 'along-demo-trips-v2'
const BOOKINGS_KEY = 'along-demo-bookings-v2'
const DEMO_SESSION_KEY = 'along-demo-session-v1'
const ACTIVE_TRIP_STATUSES = new Set<Trip['status']>(['upcoming', 'full'])
const DEMO_TRIP_IDS = new Set(['trip-nicha', 'trip-arin', 'trip-mali', 'trip-krit'])

const isActiveTrip = (trip: Trip) => ACTIVE_TRIP_STATUSES.has(trip.status)
export const isDemoSeedTrip = (trip: Trip) => trip.isDemoSeed === true || DEMO_TRIP_IDS.has(trip.id)
const normalizeTrip = (trip: Trip): Trip => isDemoSeedTrip(trip) ? { ...trip, isDemoSeed: true, status: 'draft' } : trip

const readLocalTrips = (): Trip[] => {
  const saved = localStorage.getItem(TRIPS_KEY)
  if (saved) {
    const parsed = (JSON.parse(saved) as Trip[]).map(normalizeTrip)
    if (parsed[0]?.departureTime.slice(0, 10) === new Date().toLocaleDateString('en-CA')) return parsed
  }
  const seeded = createDemoTrips()
  localStorage.setItem(TRIPS_KEY, JSON.stringify(seeded))
  return seeded
}

const saveLocalTrips = (trips: Trip[]) => localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
const readLocalBookings = () => JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? '[]') as Booking[]
const saveLocalBookings = (bookings: Booking[]) => localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
const createDemoSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
const getDemoSessionId = () => {
  const saved = localStorage.getItem(DEMO_SESSION_KEY)
  if (saved) return saved
  const created = createDemoSessionId()
  localStorage.setItem(DEMO_SESSION_KEY, created)
  return created
}
const renewDemoSession = () => {
  const created = createDemoSessionId()
  localStorage.setItem(DEMO_SESSION_KEY, created)
  return created
}

export const loadTrips = async (): Promise<{ trips: Trip[]; mode: 'firebase' | 'demo' }> => {
  const firestore = await getFirebaseDb()
  if (firestore) {
    try {
      const snapshot = await getDocs(collection(firestore, 'trips'))
      if (!snapshot.empty) {
        const trips = snapshot.docs.map((item) => normalizeTrip(item.data() as Trip))
        saveLocalTrips(trips)
        return { trips, mode: 'firebase' }
      }
      const trips = createDemoTrips()
      const batch = writeBatch(firestore)
      trips.forEach((trip) => batch.set(doc(firestore, 'trips', trip.id), trip))
      await batch.commit()
      saveLocalTrips(trips)
      return { trips, mode: 'firebase' }
    } catch { /* fall through to resilient demo mode */ }
  }
  return { trips: readLocalTrips(), mode: 'demo' }
}

export const subscribeToTrips = async (onTrips: (trips: Trip[]) => void) => {
  const firestore = await getFirebaseDb()
  if (!firestore) return () => undefined

  return onSnapshot(collection(firestore, 'trips'), (snapshot) => {
    const trips = snapshot.docs.map((item) => normalizeTrip(item.data() as Trip))
    saveLocalTrips(trips)
    onTrips(trips)
  }, () => {
    // Keep the last known local state when the live listener is interrupted.
  })
}

export const publishTrip = async (trip: Trip): Promise<'firebase' | 'demo'> => {
  const activeTripError = 'Finish your current trip before publishing another one.'
  const localTrips = readLocalTrips()
  if (localTrips.some((item) => item.driverId === trip.driverId && item.id !== trip.id && isActiveTrip(item) && !isDemoSeedTrip(item))) {
    throw new Error(activeTripError)
  }

  const firestore = await getFirebaseDb()
  if (firestore) {
    try {
      const snapshot = await getDocs(collection(firestore, 'trips'))
      const remoteTrips = snapshot.docs.map((item) => ({ ref: item.ref, trip: normalizeTrip(item.data() as Trip) }))
      const hasActiveTrip = remoteTrips.some(({ trip: existing }) => {
        return existing.driverId === trip.driverId && existing.id !== trip.id && isActiveTrip(existing) && !isDemoSeedTrip(existing)
      })
      if (hasActiveTrip) throw new Error(activeTripError)
      const batch = writeBatch(firestore)
      remoteTrips.forEach(({ ref, trip: existing }) => {
        if (existing.driverId === trip.driverId && isActiveTrip(existing) && isDemoSeedTrip(existing)) {
          batch.update(ref, { status: 'completed' })
        }
      })
      batch.set(doc(firestore, 'trips', trip.id), trip)
      await batch.commit()
      saveLocalTrips([trip, ...localTrips
        .filter((item) => item.id !== trip.id)
        .map((item) => item.driverId === trip.driverId && isActiveTrip(item) && isDemoSeedTrip(item) ? { ...item, status: 'completed' as const } : item)])
      return 'firebase'
    } catch (error) {
      if (error instanceof Error && /current trip/i.test(error.message)) throw error
      // Firebase unavailable: continue in resilient local demo mode.
    }
  }
  saveLocalTrips([trip, ...localTrips
    .filter((item) => item.id !== trip.id)
    .map((item) => item.driverId === trip.driverId && isActiveTrip(item) && isDemoSeedTrip(item) ? { ...item, status: 'completed' as const } : item)])
  return 'demo'
}

export const completeDriverTrips = async (driverId: string) => {
  const localTrips = readLocalTrips()
  const completedTripIds = new Set(localTrips
    .filter((trip) => trip.driverId === driverId && isActiveTrip(trip) && !isDemoSeedTrip(trip))
    .map((trip) => trip.id))
  const firestore = await getFirebaseDb()
  if (firestore) {
    const snapshot = await getDocs(collection(firestore, 'trips'))
    const tripBatch = writeBatch(firestore)
    let hasTripUpdates = false
    snapshot.docs.forEach((item) => {
      const trip = item.data() as Trip
      if (trip.driverId === driverId && isActiveTrip(trip) && !isDemoSeedTrip(trip)) {
        completedTripIds.add(trip.id)
        tripBatch.update(item.ref, { status: 'completed' })
        hasTripUpdates = true
      }
    })
    if (hasTripUpdates) await tripBatch.commit()

    try {
      const bookingSnapshot = await getDocs(collection(firestore, 'bookings'))
      const bookingBatch = writeBatch(firestore)
      let hasBookingUpdates = false
      bookingSnapshot.docs.forEach((item) => {
        const booking = item.data() as Booking
        if (completedTripIds.has(booking.tripId) && booking.status === 'confirmed') {
          bookingBatch.update(item.ref, { status: 'completed' })
          hasBookingUpdates = true
        }
      })
      if (hasBookingUpdates) await bookingBatch.commit()
    } catch {
      // Older deployed demo rules may not allow booking updates yet. Trip status still releases the booking below.
    }
  }

  const trips = localTrips.map((trip) => (
    completedTripIds.has(trip.id) ? { ...trip, status: 'completed' as const } : trip
  ))
  saveLocalTrips(trips)
  saveLocalBookings(readLocalBookings().map((booking) => (
    completedTripIds.has(booking.tripId) && booking.status === 'confirmed'
      ? { ...booking, status: 'completed' as const }
      : booking
  )))
}

const createBookingFromMatch = (match: MatchResult, passengerId: string, demoSessionId: string): Booking => ({
  id: `booking-active-${passengerId}-${demoSessionId}`,
  tripId: match.trip.id,
  driverId: match.trip.driverId,
  passengerId,
  pickup: match.passengerRoute.path.length ? {
    ...match.trip.origin,
    name: match.trip.origin.name,
  } : match.trip.origin,
  dropoff: match.trip.destination,
  estimatedPickupTime: match.estimatedPickupTime,
  estimatedArrivalTime: match.estimatedArrivalTime,
  detourMinutes: match.detourMinutes,
  detourDistanceMeters: match.detourDistanceMeters,
  routeOverlapPercent: match.routeOverlapPercent,
  compatibilityScore: match.compatibilityScore,
  requestedSeats: 1,
  status: 'confirmed',
  createdAt: new Date().toISOString(),
  demoSessionId,
})

export const bookMatch = async (match: MatchResult, passengerId: string, pickup: Booking['pickup'], dropoff: Booking['dropoff']) => {
  const demoSessionId = getDemoSessionId()
  const booking = { ...createBookingFromMatch(match, passengerId, demoSessionId), pickup, dropoff }
  const activeBookingError = 'Finish or reset your current ride before booking another driver.'
  const localBookings = readLocalBookings()
  if (localBookings.some((item) => item.passengerId === passengerId && item.status === 'confirmed' && item.demoSessionId === demoSessionId)) {
    throw new Error(activeBookingError)
  }

  const firestore = await getFirebaseDb()
  let committedTrip: Trip | null = null

  if (firestore) {
    try {
      const existingBookings = await getDocs(collection(firestore, 'bookings'))
      if (existingBookings.docs.some((item) => {
        const existing = item.data() as Booking
        return existing.passengerId === passengerId && existing.status === 'confirmed' && existing.demoSessionId === demoSessionId
      })) throw new Error(activeBookingError)

      committedTrip = await runTransaction(firestore, async (transaction) => {
        const tripRef = doc(firestore, 'trips', match.trip.id)
        const bookingRef = doc(firestore, 'bookings', booking.id)
        const bookingSnapshot = await transaction.get(bookingRef)
        if (bookingSnapshot.exists() && (bookingSnapshot.data() as Booking).status === 'confirmed') {
          throw new Error(activeBookingError)
        }
        const tripSnapshot = await transaction.get(tripRef)
        if (!tripSnapshot.exists()) throw new Error('This trip is no longer available.')
        const trip = tripSnapshot.data() as Trip
        if (trip.status !== 'upcoming') throw new Error('This trip is no longer available.')
        if (trip.availableSeats < 1) throw new Error('This ride just became full.')
        const availableSeats = trip.availableSeats - 1
        const updatedTrip: Trip = { ...trip, availableSeats, status: availableSeats === 0 ? 'full' : 'upcoming' }
        transaction.update(tripRef, { availableSeats: updatedTrip.availableSeats, status: updatedTrip.status })
        transaction.set(bookingRef, booking)
        return updatedTrip
      })
    } catch (error) {
      if (error instanceof Error && /full|available|current ride|active booking/i.test(error.message)) throw error
      // Firebase unavailable: continue atomically in the browser fallback.
    }
  }

  const trips = readLocalTrips()
  const index = trips.findIndex((trip) => trip.id === match.trip.id)
  if (committedTrip) {
    if (index >= 0) trips[index] = committedTrip
    else trips.unshift(committedTrip)
  } else {
    if (index < 0 || trips[index].status !== 'upcoming') throw new Error('This trip is no longer available.')
    if (trips[index].availableSeats < 1) throw new Error('This ride just became full.')
    const availableSeats = trips[index].availableSeats - 1
    trips[index] = { ...trips[index], availableSeats, status: availableSeats === 0 ? 'full' : 'upcoming' }
    committedTrip = trips[index]
  }
  saveLocalTrips(trips)
  saveLocalBookings([booking, ...localBookings.filter((item) => item.id !== booking.id)])
  return { booking, updatedTrip: committedTrip }
}

export const loadActiveBookingTripId = async (passengerId: string) => {
  const demoSessionId = getDemoSessionId()
  const resolveActive = (bookings: Booking[], trips: Trip[]) => {
    const sessionBookings = bookings.filter((item) => (
      item.passengerId === passengerId && item.demoSessionId === demoSessionId
    ))
    const activeTripIds = new Set(trips
      .filter((trip) => isActiveTrip(trip) && !isDemoSeedTrip(trip))
      .map((trip) => trip.id))
    const active = sessionBookings.find((booking) => (
      booking.status === 'confirmed' && activeTripIds.has(booking.tripId)
    ))
    if (active) return active.tripId

    // A completed/cancelled ride starts a new demo booking lifecycle without requiring old records to be deleted.
    if (sessionBookings.length) renewDemoSession()
    return null
  }

  const firestore = await getFirebaseDb()
  if (firestore) {
    try {
      const [bookingSnapshot, tripSnapshot] = await Promise.all([
        getDocs(collection(firestore, 'bookings')),
        getDocs(collection(firestore, 'trips')),
      ])
      return resolveActive(
        bookingSnapshot.docs.map((item) => item.data() as Booking),
        tripSnapshot.docs.map((item) => normalizeTrip(item.data() as Trip)),
      )
    } catch { /* use the browser fallback below */ }
  }

  return resolveActive(readLocalBookings(), readLocalTrips())
}

export const resetDemo = async () => {
  renewDemoSession()
  const trips = createDemoTrips()
  saveLocalTrips(trips)
  localStorage.setItem(BOOKINGS_KEY, '[]')
  const firestore = await getFirebaseDb()
  if (firestore) {
    try {
      const batch = writeBatch(firestore)
      const snapshot = await getDocs(collection(firestore, 'trips'))
      const seedIds = new Set(trips.map((trip) => trip.id))
      snapshot.docs.forEach((item) => {
        const trip = item.data() as Trip
        if (!seedIds.has(trip.id) && isActiveTrip(trip)) batch.update(item.ref, { status: 'completed' })
      })
      trips.forEach((trip) => batch.set(doc(firestore, 'trips', trip.id), trip))
      await batch.commit()
    } catch { /* demo reset remains complete locally */ }

    try {
      const bookingSnapshot = await getDocs(collection(firestore, 'bookings'))
      if (!bookingSnapshot.empty) {
        const bookingBatch = writeBatch(firestore)
        bookingSnapshot.docs.forEach((item) => bookingBatch.delete(item.ref))
        await bookingBatch.commit()
      }
    } catch { /* deployed rules may intentionally keep remote booking history */ }
  }
  return trips
}
