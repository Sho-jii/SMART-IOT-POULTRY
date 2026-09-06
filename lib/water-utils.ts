import { ref, set } from "firebase/database"
import {
  HYDRATION_WARNING_THRESHOLD,
  HYDRATION_ALERT_THRESHOLD,
  DEFAULT_FLOW_RATE,
} from "@/config/alert-thresholds"

// Define water consumption rates based on age (ml per chicken per day)
export const WATER_CONSUMPTION_RATES = {
  chick: 80, // 0-8 weeks
  grower: 150, // 8-20 weeks
  adult: 200, // 20+ weeks (broilers at 45 days need 180-250ml)
}

export const DEFAULT_WATER_FLOW_RATE = DEFAULT_FLOW_RATE

/**
 * Calculate recommended water based on age group and chicken count
 */
export function calculateRecommendedWater(
  ageGroup: "chick" | "grower" | "adult",
  chickenCount: number,
): number {
  return WATER_CONSUMPTION_RATES[ageGroup] * chickenCount
}

/**
 * Calculate pump run time based on ml
 */
export function calculatePumpRunTime(
  ml: number,
  flowRate: number = DEFAULT_WATER_FLOW_RATE,
): number {
  return ml / flowRate
}

/**
 * Format a timestamp to a readable date/time string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

/**
 * Get the hydration status based on water consumption
 */
export function getHydrationStatus(waterPerBird: number): "normal" | "warning" | "alert" {
  if (waterPerBird < HYDRATION_ALERT_THRESHOLD) {
    return "alert"
  } else if (waterPerBird < HYDRATION_WARNING_THRESHOLD) {
    return "warning"
  } else {
    return "normal"
  }
}

/**
 * Convert ml to liters with proper formatting
 */
export function mlToLiters(ml: number): string {
  return (ml / 1000).toFixed(2) + "L"
}

/**
 * Add sample water usage data to Firebase for testing
 */
export async function addSampleWaterData(database: any): Promise<boolean> {
  if (!database) {
    console.error("Database not initialized")
    return false
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const volumeDispensed = Math.floor(Math.random() * 1000) + 500
    const durationSeconds = Math.floor(volumeDispensed / 100)

    const waterLogRef = ref(database, `/waterLogs/${timestamp}`)
    await set(waterLogRef, {
      timestamp,
      volumeDispensed,
      durationSeconds,
    })

    return true
  } catch (error) {
    console.error("Error adding sample water data:", error)
    return false
  }
}

/**
 * Populate water usage data with multiple entries for testing
 */
export async function populateWaterData(database: any, count = 24): Promise<boolean> {
  if (!database) {
    console.error("Database not initialized")
    return false
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    const hourInSeconds = 60 * 60

    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * hourInSeconds
      const volumeDispensed = Math.floor(Math.random() * 1000) + 500
      const durationSeconds = Math.floor(volumeDispensed / 100)

      const waterLogRef = ref(database, `/waterLogs/${timestamp}`)
      await set(waterLogRef, {
        timestamp,
        volumeDispensed,
        durationSeconds,
      })
    }

    return true
  } catch (error) {
    console.error("Error populating water data:", error)
    return false
  }
}