import {
  collection, doc, getDocs, runTransaction, setDoc, writeBatch,
} from 'firebase/firestore'
import { createDemoTrips } from '../data/demoTrips'
import { demoUsers } from '../data/demoUsers'
import type { Booking, MatchResult, Trip } from '../types'
import { db } from './firebase'

const TRIPS_KEY = 'along-demo-trips-v2'
const BOOKINGS_KEY = 'along-demo-bookings-v2'

const readLocalTrips = (): Trip[] => {
  const saved = localStorage.getItem(TRIPS_KEY)
  if (saved) {
    const parsed = JSON.parse(saved) as Trip[]
    if (parsed[0]?.departureTime.slice(0, 10) === new Date().toLocaleDateString('en-CA')) return parsed
  }
  const seeded = createDemoTrips()
  localStorage.setItem(TRIPS_KEY, JSON.stringify(seeded))
  return seeded
}

const saveLocalTrips = (trips: Trip[]) => localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))

export const loadTrips = async (): Promise<{ trips: Trip[]; mode: 'firebase' | 'demo' }> => {
  const firestore = db
  if (firestore) {
    try {
      const snapshot = await getDocs(collection(firestore, 'trips'))
      if (!snapshot.empty) return { trips: snapshot.docs.map((item) => item.data() as Trip), mode: 'firebase' }
      const trips = createDemoTrips()
      const batch = writeBatch(firestore)
      trips.forEach((trip) => batch.set(doc(firestore, 'trips', trip.id), trip))
      demoUsers.forEach((user) => batch.set(doc(firestore, 'users', user.id), user))
      await batch.commit()
      saveLocalTrips(trips)
      return { trips, mode: 'firebase' }
    } catch { /* fall through to resilient demo mode */ }
  }
  return { trips: readLocalTrips(), mode: 'demo' }
}

export const publishTrip = async (trip: Trip): Promise<'firebase' | 'demo'> => {
  const trips = readLocalTrips().filter((item) => item.id !== trip.id)
  saveLocalTrips([trip, ...trips])
  if (db) {
    try {
      await setDoc(doc(db, 'trips', trip.id), trip)
      return 'firebase'
    } catch { /* local copy is still usable */ }
  }
  return 'demo'
}

const createBookingFromMatch = (match: MatchResult, passengerId: string): Booking => ({
  id: `booking-${Date.now()}`,
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
})

export const bookMatch = async (match: MatchResult, passengerId: string, pickup: Booking['pickup'], dropoff: Booking['dropoff']) => {
  const booking = { ...createBookingFromMatch(match, passengerId), pickup, dropoff }
  const firestore = db

  if (firestore) {
    try {
      await runTransaction(firestore, async (transaction) => {
        const tripRef = doc(firestore, 'trips', match.trip.id)
        const snapshot = await transaction.get(tripRef)
        if (!snapshot.exists()) throw new Error('This trip is no longer available.')
        const trip = snapshot.data() as Trip
        if (trip.availableSeats < 1 || trip.status === 'full') throw new Error('This ride just became full.')
        const availableSeats = trip.availableSeats - 1
        transaction.update(tripRef, { availableSeats, status: availableSeats === 0 ? 'full' : 'upcoming' })
        transaction.set(doc(firestore, 'bookings', booking.id), booking)
      })
    } catch (error) {
      if (error instanceof Error && /full|available/i.test(error.message)) throw error
      // Firebase unavailable: continue atomically in the browser fallback.
    }
  }

  const trips = readLocalTrips()
  const index = trips.findIndex((trip) => trip.id === match.trip.id)
  if (index < 0 || trips[index].availableSeats < 1) throw new Error('This ride just became full.')
  const availableSeats = trips[index].availableSeats - 1
  trips[index] = { ...trips[index], availableSeats, status: availableSeats === 0 ? 'full' : 'upcoming' }
  saveLocalTrips(trips)
  const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? '[]') as Booking[]
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify([booking, ...bookings]))
  return { booking, updatedTrip: trips[index] }
}

export const resetDemo = async () => {
  const trips = createDemoTrips()
  saveLocalTrips(trips)
  localStorage.setItem(BOOKINGS_KEY, '[]')
  const firestore = db
  if (firestore) {
    try {
      const batch = writeBatch(firestore)
      trips.forEach((trip) => batch.set(doc(firestore, 'trips', trip.id), trip))
      demoUsers.forEach((user) => batch.set(doc(firestore, 'users', user.id), user))
      await batch.commit()
    } catch { /* demo reset remains complete locally */ }
  }
  return trips
}
