"use client"

import { useState, useEffect, useCallback } from "react"
import { ref, onValue, get } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { SensorData } from "../types"

export function useSensorData() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: null,
    humidity: null,
    foodLevel: null,
    waterLevelMain: null,
    waterLevelDrinker: null,
    lastUpdated: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const parseSensorPayload = (data: any): Partial<SensorData> => {
    if (!data) return {}

    const result: Partial<SensorData> = {
      lastUpdated: new Date(),
    }

    if (data.temperature !== undefined) {
      const val = Number(data.temperature)
      result.temperature = isNaN(val) ? null : val
    }
    if (data.humidity !== undefined) {
      const val = Number(data.humidity)
      result.humidity = isNaN(val) ? null : val
    }
    if (data.foodLevel !== undefined) {
      const val = Number(data.foodLevel)
      result.foodLevel = isNaN(val) ? null : val
    }
    if (data.waterLevelMain !== undefined) {
      const val = Number(data.waterLevelMain)
      result.waterLevelMain = isNaN(val) ? null : val
    }
    if (data.waterLevelDrinker !== undefined) {
      const val = Number(data.waterLevelDrinker)
      result.waterLevelDrinker = isNaN(val) ? null : val
    }

    return result
  }

  // Realtime subscription
  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Failed to initialize Firebase database")
      setIsLoading(false)
      return
    }

    try {
      const sensorsRef = ref(firebase.database, "/sensors")
      const unsubscribe = onValue(
        sensorsRef,
        (snapshot) => {
          const data = snapshot.val()
          if (data) {
            const parsed = parseSensorPayload(data)
            setSensorData((prev) => ({ ...prev, ...parsed }))
          }
          setIsLoading(false)
        },
        (err) => {
          console.error("Firebase sensor listener error:", err)
          setError(err.message)
          setIsLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("Error setting up sensor listener:", err)
      setError(err.message)
      setIsLoading(false)
    }
  }, [])

  const refreshSensors = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    setIsRefreshing(true)
    try {
      const sensorsRef = ref(firebase.database, "/sensors")
      const snapshot = await get(sensorsRef)
      const data = snapshot.val()
      if (data) {
        const parsed = parseSensorPayload(data)
        setSensorData((prev) => ({ ...prev, ...parsed }))
      }
    } catch (err) {
      console.error("Manual sensor refresh failed:", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  return {
    ...sensorData,
    isLoading,
    error,
    isRefreshing,
    refreshSensors,
  }
}
