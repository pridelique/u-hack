# Along

> Already going that way? Go together.

Along is a polished U-Hackathon MVP that matches passengers with verified drivers who are **already** traveling in the same direction. It demonstrates the complete driver publish → passenger search → detour check → ranking → comparison → booking → seat update flow.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. The application works immediately in demo mode without external credentials.

```bash
npm run build
npm run preview
```

## 90-second demo

1. Use **Reset demo** to clear published rides and restore each driver's own draft.
2. Switch to Nicha, Arin, and Mali in turn and publish each prefilled draft.
3. Switch to **Pim — Passenger** and search Samyan Mitrtown → Kasetsart University at 17:10.
4. Choose any two published trips and compare them.
5. Book one match; its remaining seat count drops immediately and every other booking button is blocked while that ride is active.
6. Use **Reset demo** to start a clean scenario, or end a driver's trip before publishing their next one.

## Test cases

| Scenario | Input | Expected result |
| --- | --- | --- |
| No unpublished drivers | Immediately after **Reset demo**, search Samyan Mitrtown → Kasetsart University at 17:10 | No rides are found until a driver publishes. |
| Multiple compatible drivers | Publish Nicha, Arin, and Mali, then search Samyan Mitrtown → Kasetsart University at 17:10 | All three are available for ranking and two-driver comparison. |
| Women drivers only | Same route and time, enable **Women drivers only** | Nicha and Mali remain; Arin is excluded. |
| Different corridor | Publish Krit, then search Bang Na → Chonburi at 17:00 | Krit is the relevant driver; Bangkok-to-Rangsit trips are excluded. |
| Time mismatch | Use a time more than 45 minutes away from all published trips | No compatible rides. |
| One active passenger ride | Book one driver as Pim, then try another | Every other booking is blocked without reducing a seat. |
| Passenger ride completed | Book Nicha, end Nicha's trip, then return to Pim | The booking is completed and Pim can book another published driver. |
| Driver-specific drafts | Switch drivers immediately after **Reset demo** | Nicha, Arin, Mali, and Krit each see their own prefilled route, but none is searchable yet. |
| Duplicate active trip | Publish a driver trip, then return to Driver mode | The active trip is shown and another cannot be published until **End trip** is used. |

## Demo mode

Demo mode is deliberately resilient for judging. It supplies seeded users, driver-specific drafts, route geometry, match metrics, booking state, and seat updates from browser storage. Drafts never appear in passenger search until the corresponding driver publishes. If Google routing or Firebase is unavailable, the UI labels the result **Using demo route estimates** and shows a route diagram rather than a broken map.

The demo verification badges are simulated. No identity documents, licences, selfies, biometrics, or private home addresses are collected.

## Google Maps and Routes

Copy `.env.example` to `.env.local` and set:

- `VITE_GOOGLE_MAPS_API_KEY`: browser-restricted key with Maps JavaScript API and Places API (New) enabled.
- `GOOGLE_ROUTES_API_KEY`: server-only key with Routes API enabled. Configure this in Vercel; never expose it as a `VITE_` variable.

The browser key loads the map and Place Autocomplete. `api/routes.ts` proxies explicit route requests to Google Routes. Requests are session-cached, and cheap date/seat/safety/time/direction/corridor filters run before detailed detour calls.

## Firebase

Create a Firebase web app, enable Firestore and Anonymous Authentication, then fill the four `VITE_FIREBASE_*` values in `.env.local`. Deploy `firestore.rules` with the Firebase CLI. On startup, Along signs in anonymously and uses the three collections described by the brief: `users`, `trips`, and `bookings`.

An empty Firestore project is seeded automatically with demo users and non-searchable trip drafts. **Reset demo** restores those drafts, completes active test trips, and starts a fresh demo booking session even if older deployed rules keep booking history. Booking uses one deterministic active-booking record per passenger/session and a Firestore transaction to prevent a second active ride, verify capacity, decrement `availableSeats`, mark a zero-seat trip `full`, and create the booking. Ending a driver trip also completes its confirmed bookings and releases those passengers to book again. Production would remove demo sessions and enforce this rule per authenticated passenger with stronger authorization rules.

## Deployment

The repo is Vercel-ready. Add the environment variables in the Vercel project and deploy normally. Without them, the deployed app remains fully demonstrable in browser-local demo mode.
