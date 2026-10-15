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

Demo mode is deliberately resilient for judging. It supplies seeded users, driver-specific drafts, route geometry, match metrics, booking state, and seat updates from browser storage. Drafts never appear in passenger search until the corresponding driver publishes. If Longdo routing or Firebase is unavailable, the UI labels the result **Using demo route estimates** and shows a route diagram rather than a broken map.

The demo verification badges are simulated. No identity documents, licences, selfies, biometrics, or private home addresses are collected.

## Longdo Map, Search, and Routes

Copy `.env.example` to `.env.local` and set:

- `VITE_LONGDO_MAP_API_KEY`: the single domain-restricted key used for Longdo Map API v3, Search, and Route.

The key is tied to registered website URLs. The proxies forward the validated page origin/referrer so the same key works for the browser map and server-side requests. Register both the local URL and every deployed domain in Longdo's key settings.

`api/places.ts` proxies debounced Longdo Search requests and `api/routes.ts` proxies traffic-aware Longdo Route GeoJSON requests. The browser caches complete routes for the session, while the server caches route legs and place searches for short periods. Multi-stop detours reuse their first route leg for pickup-time calculation instead of requesting it twice. Cheap date, seat, safety, time, direction, and corridor filters run first, and detailed road calculations are capped at three candidates per search to protect the free-tier quota.

## Firebase

Create a Firebase web app, enable Firestore and Anonymous Authentication, then fill the `VITE_FIREBASE_*` values in `.env.local`. Deploy `firestore.rules` with the Firebase CLI or Firebase Console. On startup, Along signs in anonymously and uses the three collections described by the brief: `users`, `trips`, and `bookings`.

An empty Firestore project is seeded automatically with demo users and non-searchable trip drafts. **Reset demo** restores those drafts, completes active test trips, and starts a fresh demo booking session even if older deployed rules keep booking history. Booking uses one deterministic active-booking record per passenger/session and a Firestore transaction to prevent a second active ride, verify capacity, decrement `availableSeats`, mark a zero-seat trip `full`, and create the booking. Ending a driver trip also completes its confirmed bookings and releases those passengers to book again. Production would remove demo sessions and enforce this rule per authenticated passenger with stronger authorization rules.

## Deployment

The repo is Vercel-ready. Before deploying:

1. Add `VITE_LONGDO_MAP_API_KEY` and all `VITE_FIREBASE_*` values from `.env.example` to the Vercel project for the Production environment.
2. Register the production domain in the Longdo key settings. Register Preview domains too if they need live maps.
3. Enable Firebase Anonymous Authentication and publish `firestore.rules`.
4. Redeploy after changing any `VITE_*` variable because Vite embeds those values during the build.

Without live-service variables, the deployed app remains demonstrable with browser-local storage and route estimates.
