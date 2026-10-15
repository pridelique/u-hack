import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = [
  config.apiKey,
  config.authDomain,
  config.projectId,
  config.appId,
].every(Boolean)

let app: FirebaseApp | null = null
let database: Firestore | null = null
let firebaseReady: Promise<Firestore | null> = Promise.resolve(null)

if (firebaseConfigured) {
  try {
    app = initializeApp(config)
    database = getFirestore(app)
    const auth = getAuth(app)
    firebaseReady = signInAnonymously(auth)
      .then(() => database)
      .catch(() => null)
  } catch {
    database = null
    firebaseReady = Promise.resolve(null)
  }
}

export const getFirebaseDb = () => firebaseReady
