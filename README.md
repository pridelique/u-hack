# Along

> Already going that way? Go together.

Along is a polished U-Hackathon MVP that matches passengers with verified drivers who are **already** traveling in the same direction. It demonstrates the complete driver publish → passenger search → detour check → ranking → comparison → booking → seat update flow.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The application works immediately in demo mode without external credentials.

```bash
npm run build
npm run preview
```

## 90-second demo

1. Use **Nicha — Driver** and publish the prefilled Chulalongkorn University → Future Park Rangsit trip.
2. Switch to **Pim — Passenger**.
3. Search the prefilled Samyan Mitrtown → Kasetsart University journey at 17:10.
4. Select two results and compare them.
5. Book the recommended match; its remaining seat count drops immediately.
6. Use **Reset demo** to restore trips, seats, and bookings.

## Demo mode

Demo mode is deliberately resilient for judging. It supplies seeded users, trips, route geometry, match metrics, booking state, and seat updates from browser storage. If Google routing or Firebase is unavailable, the UI labels the result **Using demo route estimates** and shows a route diagram rather than a broken map.

The demo verification badges are simulated. No identity documents, licences, selfies, biometrics, or private home addresses are collected.

## Google Maps and Routes

Copy `.env.example` to `.env.local` and set:

- `VITE_GOOGLE_MAPS_API_KEY`: browser-restricted key with Maps JavaScript API and Places API enabled.
- `GOOGLE_ROUTES_API_KEY`: server-only key with Routes API enabled. Configure this in Vercel; never expose it as a `VITE_` variable.

The browser key loads the map and Place Autocomplete. `api/routes.ts` proxies explicit route requests to Google Routes. Requests are session-cached, and cheap date/seat/safety/time/direction/corridor filters run before detailed detour calls.

## Firebase

Create a Firebase web app, enable Firestore and Anonymous Authentication, then fill the four `VITE_FIREBASE_*` values in `.env.local`. Deploy `firestore.rules` with the Firebase CLI. On startup, Along signs in anonymously and uses the three collections described by the brief: `users`, `trips`, and `bookings`.

An empty Firestore project is seeded automatically with demo users and trips; **Reset demo** restores the same records. Booking uses a Firestore transaction to verify capacity, decrement `availableSeats`, mark a zero-seat trip `full`, and create the booking. Production would require stronger per-user authorization rules.

## Deployment

The repo is Vercel-ready. Add the environment variables in the Vercel project and deploy normally. Without them, the deployed app remains fully demonstrable in browser-local demo mode.
