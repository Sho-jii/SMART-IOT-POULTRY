import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { type Database, getDatabase, ref, get } from "firebase/database"

// Firebase configuration loaded strictly from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

/**
 * Initialize Firebase if it hasn't been initialized yet
 * @returns Firebase app instance and database
 */
export function initFirebase(): { app: FirebaseApp; database: Database } | null {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.error("Firebase can only be initialized in a browser environment")
    return null
  }

  if (!firebaseConfig.databaseURL) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_DATABASE_URL in environment configuration.")
    return null
  }

  try {
    const apps = getApps()
    let app: FirebaseApp

    if (apps.length === 0) {
      app = initializeApp(firebaseConfig)
      console.log("Firebase initialized successfully")
    } else {
      app = apps[0]
      console.log("Using existing Firebase instance")
    }

    const database = getDatabase(app)
    return { app, database }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    return null
  }
}

/**
 * Test Firebase connection by trying to read a test path
 * @param database Firebase database instance
 * @returns Promise that resolves to true if connection is successful
 */
export async function testFirebaseConnection(database: Database | undefined): Promise<boolean> {
  if (!database) {
    console.error("Database instance is undefined")
    return false
  }

  try {
    const testRef = ref(database, "/test")
    await get(testRef)
    console.log("Firebase connection test successful")
    return true
  } catch (error) {
    console.error("Firebase connection test failed:", error)
    return false
  }
}
