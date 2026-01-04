import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'undefined'
)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let initPromise: Promise<void> | null = null

async function initializeFirebase(): Promise<void> {
  if (!isFirebaseConfigured) {
    console.log('Firebase not configured, running in demo mode')
    return
  }
  
  if (app) return // Already initialized
  
  try {
    const { initializeApp } = await import('firebase/app')
    const { getAuth } = await import('firebase/auth')
    const { getFirestore } = await import('firebase/firestore')
    
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

// Lazy initialization with singleton pattern
async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeFirebase()
  }
  await initPromise
}

export async function getFirebaseAuth(): Promise<Auth | null> {
  await ensureInitialized()
  return auth
}

export async function getFirebaseDb(): Promise<Firestore | null> {
  await ensureInitialized()
  return db
}

// Legacy exports - null until initialized
export { auth, db }
export default app
