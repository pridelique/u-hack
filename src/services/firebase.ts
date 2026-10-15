import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Object.values(config).every(Boolean)

let app: FirebaseApp | null = null
let database: Firestore | null = null

if (firebaseConfigured) {
  try {
    app = initializeApp(config)
    database = getFirestore(app)
    signInAnonymously(getAuth(app)).catch(() => undefined)
  } catch {
    database = null
  }
}

export const db = database
