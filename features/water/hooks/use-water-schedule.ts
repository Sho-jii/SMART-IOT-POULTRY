"use client"

import { useState, useEffect, useCallback } from "react"
import { ref, onValue, set } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { WaterSchedule, WaterSettings } from "../types"
import { DEFAULT_FLOW_RATE, DEFAULT_FILL_DURATION } from "@/config/alert-thresholds"
import { toast } from "sonner"

export function useWaterSchedule() {
  const [schedule, setSchedule] = useState<WaterSchedule>({})
  const [settings, setSettings] = useState<WaterSettings>({
    flowRate: DEFAULT_FLOW_RATE,
    fillDuration: DEFAULT_FILL_DURATION,
    autoEnabled: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isManualFilling, setIsManualFilling] = useState(false)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setIsLoading(false)
      return
    }

    const scheduleRef = ref(firebase.database, "/waterSchedule")
    const unsubSchedule = onValue(
      scheduleRef,
      (snapshot) => {
        const data = snapshot.val() || {}
        const formatted: WaterSchedule = {}
        for (let i = 0; i < 24; i++) {
          const key = i.toString()
          formatted[key] = !!data[key]
        }
        setSchedule(formatted)
        setIsLoading(false)
      },
      (err) => {
        console.error("Firebase water schedule error:", err)
        setIsLoading(false)
      },
    )

    const settingsRef = ref(firebase.database, "/waterSettings")
    const unsubSettings = onValue(
      settingsRef,
      (snapshot) => {
        const data = snapshot.val() || {}
        setSettings({
          flowRate: data.flowRate || DEFAULT_FLOW_RATE,
          fillDuration: data.fillDuration || DEFAULT_FILL_DURATION,
          autoEnabled: data.autoEnabled !== undefined ? data.autoEnabled : true,
        })
      },
      (err) => console.error("Firebase water settings error:", err),
    )

    return () => {
      unsubSchedule()
      unsubSettings()
    }
  }, [])

  const toggleWaterHour = useCallback(
    async (hour: number) => {
      const firebase = initFirebase()
      if (!firebase?.database) return

      const key = hour.toString()
      const nextVal = !schedule[key]
      const nextSchedule = { ...schedule, [key]: nextVal }
      setSchedule(nextSchedule)

      try {
        await set(ref(firebase.database, `/waterSchedule/${key}`), nextVal)
        toast.success(
          nextVal
            ? `Water filling at ${hour.toString().padStart(2, "0")}:00 Enabled`
            : `Water filling at ${hour.toString().padStart(2, "0")}:00 Disabled`,
        )
      } catch (err) {
        console.error("Error updating water schedule:", err)
        toast.error("Failed to update water schedule")
        setSchedule(schedule)
      }
    },
    [schedule],
  )

  const updateFillDuration = useCallback(
    async (duration: number) => {
      const firebase = initFirebase()
      if (!firebase?.database) return

      setSettings((prev) => ({ ...prev, fillDuration: duration }))
      try {
        await set(ref(firebase.database, "/waterSettings/fillDuration"), duration)
      } catch (err) {
        console.error("Error updating fill duration:", err)
      }
    },
    [],
  )

  const updateFlowRate = useCallback(
    async (rate: number) => {
      const firebase = initFirebase()
      if (!firebase?.database) return

      setSettings((prev) => ({ ...prev, flowRate: rate }))
      try {
        await set(ref(firebase.database, "/waterSettings/flowRate"), rate)
      } catch (err) {
        console.error("Error updating flow rate:", err)
      }
    },
    [],
  )

  const toggleAutoWater = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const nextState = !settings.autoEnabled
    setSettings((prev) => ({ ...prev, autoEnabled: nextState }))
    try {
      await set(ref(firebase.database, "/waterSettings/autoEnabled"), nextState)
      toast.info(nextState ? "Auto Watering Enabled" : "Auto Watering Disabled")
    } catch (err) {
      console.error("Error toggling auto water:", err)
    }
  }, [settings.autoEnabled])

  const triggerManualFill = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    setIsManualFilling(true)
    try {
      await set(ref(firebase.database, "/controls/waterFill"), true)
      toast.success("Water Pump Activated", {
        description: `Dispensing water for ${settings.fillDuration} seconds`,
      })
      setTimeout(() => {
        set(ref(firebase.database, "/controls/waterFill"), false).catch(console.error)
        setIsManualFilling(false)
      }, 2000)
    } catch (err) {
      console.error("Error triggering manual water fill:", err)
      toast.error("Failed to trigger water pump")
      setIsManualFilling(false)
    }
  }, [settings.fillDuration])

  return {
    schedule,
    settings,
    isLoading,
    isManualFilling,
    toggleWaterHour,
    updateFillDuration,
    updateFlowRate,
    toggleAutoWater,
    triggerManualFill,
  }
}
