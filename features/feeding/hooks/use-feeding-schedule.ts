"use client"

import { useState, useEffect, useCallback } from "react"
import { ref, onValue, set } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { FeedingSchedule, FeedingSettings } from "../types"
import { toast } from "sonner"

export function useFeedingSchedule() {
  const [schedule, setSchedule] = useState<FeedingSchedule>({})
  const [settings, setSettings] = useState<FeedingSettings>({
    ageGroup: "adult",
    chickenCount: 10,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setIsLoading(false)
      return
    }

    const scheduleRef = ref(firebase.database, "/feedingSchedule")
    const unsubSchedule = onValue(
      scheduleRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const processed: FeedingSchedule = {}
          Object.keys(data).forEach((key) => {
            const numKey = Number(key)
            const val = data[key]
            processed[numKey] = val === true || val === "true" || val === 1 || val === "1"
          })
          setSchedule(processed)
        } else {
          setSchedule({})
        }
        setIsLoading(false)
      },
      (err) => {
        console.error("Firebase feeding schedule error:", err)
        setIsLoading(false)
      },
    )

    const settingsRef = ref(firebase.database, "/feedingSettings")
    const unsubSettings = onValue(
      settingsRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setSettings({
            ageGroup: data.ageGroup || "adult",
            chickenCount: data.chickenCount || 10,
            lastUpdated: data.lastUpdated,
          })
        }
      },
      (err) => console.error("Firebase feeding settings error:", err),
    )

    return () => {
      unsubSchedule()
      unsubSettings()
    }
  }, [])

  const toggleFeedingHour = useCallback(
    async (hour: number) => {
      const firebase = initFirebase()
      if (!firebase?.database) return

      const nextVal = !schedule[hour]
      const nextSchedule = { ...schedule, [hour]: nextVal }
      setSchedule(nextSchedule)

      try {
        await set(ref(firebase.database, `/feedingSchedule/${hour}`), nextVal)
        toast.success(nextVal ? `Feeding at ${hour.toString().padStart(2, "0")}:00 Enabled` : `Feeding at ${hour.toString().padStart(2, "0")}:00 Disabled`)
      } catch (err) {
        console.error("Error updating feeding schedule:", err)
        toast.error("Failed to update feeding schedule")
        setSchedule(schedule)
      }
    },
    [schedule],
  )

  const updateSettings = useCallback(async (newSettings: Partial<FeedingSettings>) => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    try {
      const merged = { ...settings, ...newSettings, lastUpdated: Math.floor(Date.now() / 1000) }
      setSettings(merged)
      await set(ref(firebase.database, "/feedingSettings"), merged)
      toast.success("Feeding parameters updated")
    } catch (err) {
      console.error("Error updating feeding settings:", err)
      toast.error("Failed to update parameters")
    }
  }, [settings])

  return {
    schedule,
    settings,
    isLoading,
    toggleFeedingHour,
    updateSettings,
  }
}
