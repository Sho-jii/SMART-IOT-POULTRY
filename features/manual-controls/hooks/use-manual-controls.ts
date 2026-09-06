"use client"

import { useState, useEffect, useCallback } from "react"
import { ref, onValue, set, get } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { DeviceStates } from "../types"
import { toast } from "sonner"

export function useManualControls() {
  const [deviceStates, setDeviceStates] = useState<DeviceStates>({
    fan: false,
    heat: false,
    pump: false,
  })
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setIsLoading(false)
      return
    }

    const deviceStatesRef = ref(firebase.database, "/deviceStates")
    const unsubDevices = onValue(
      deviceStatesRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setDeviceStates({
            fan: data.fan !== undefined ? !(data.fan === true || data.fan === "true" || data.fan === 1 || data.fan === "1") : false,
            heat: data.heat !== undefined ? !(data.heat === true || data.heat === "true" || data.heat === 1 || data.heat === "1") : false,
            pump: data.pump !== undefined ? !(data.pump === true || data.pump === "true" || data.pump === 1 || data.pump === "1") : false,
          })
        }
        setLastDataRefresh(new Date())
        setIsLoading(false)
      },
      (err) => {
        console.error("Firebase device states error:", err)
        setIsLoading(false)
      },
    )

    const automationRef = ref(firebase.database, "/controls/automationEnabled")
    const unsubAuto = onValue(
      automationRef,
      (snapshot) => {
        const enabled = snapshot.val()
        setAutomationEnabled(enabled === true || enabled === "true" || enabled === 1 || enabled === "1")
      },
      (err) => console.error("Firebase automation state error:", err),
    )

    return () => {
      unsubDevices()
      unsubAuto()
    }
  }, [])

  const toggleFan = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const nextState = !deviceStates.fan
    setDeviceStates((prev) => ({ ...prev, fan: nextState }))

    try {
      await set(ref(firebase.database, "/controls/fan"), nextState)
      toast.success(nextState ? "Exhaust Fan Activated" : "Exhaust Fan Deactivated")
    } catch (err) {
      console.error("Error updating fan state:", err)
      toast.error("Failed to toggle fan")
      setDeviceStates((prev) => ({ ...prev, fan: !nextState }))
    }
  }, [deviceStates.fan])

  const toggleHeat = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const nextState = !deviceStates.heat
    setDeviceStates((prev) => ({ ...prev, heat: nextState }))

    try {
      await set(ref(firebase.database, "/controls/heat"), nextState)
      toast.success(nextState ? "Heat Brooder Lamp Activated" : "Heat Brooder Lamp Deactivated")
    } catch (err) {
      console.error("Error updating heat state:", err)
      toast.error("Failed to toggle heater")
      setDeviceStates((prev) => ({ ...prev, heat: !nextState }))
    }
  }, [deviceStates.heat])

  const togglePump = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const nextState = !deviceStates.pump
    setDeviceStates((prev) => ({ ...prev, pump: nextState }))

    try {
      await set(ref(firebase.database, "/controls/pump"), nextState)
      toast.success(nextState ? "Water Pump Activated" : "Water Pump Deactivated")
    } catch (err) {
      console.error("Error updating pump state:", err)
      toast.error("Failed to toggle water pump")
      setDeviceStates((prev) => ({ ...prev, pump: !nextState }))
    }
  }, [deviceStates.pump])

  const toggleAutomation = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const nextState = !automationEnabled
    setAutomationEnabled(nextState)

    try {
      await set(ref(firebase.database, "/controls/automationEnabled"), nextState)
      toast.info(nextState ? "Automation Mode Enabled" : "Manual Override Mode Enabled", {
        description: nextState ? "System manages relays automatically" : "Direct hardware actuation enabled",
      })
    } catch (err) {
      console.error("Error updating automation mode:", err)
      toast.error("Failed to toggle automation")
      setAutomationEnabled(!nextState)
    }
  }, [automationEnabled])

  const refreshStates = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    try {
      const snap = await get(ref(firebase.database, "/deviceStates"))
      const data = snap.val()
      if (data) {
        setDeviceStates({
          fan: data.fan !== undefined ? !(data.fan === true || data.fan === "true" || data.fan === 1 || data.fan === "1") : false,
          heat: data.heat !== undefined ? !(data.heat === true || data.heat === "true" || data.heat === 1 || data.heat === "1") : false,
          pump: data.pump !== undefined ? !(data.pump === true || data.pump === "true" || data.pump === 1 || data.pump === "1") : false,
        })
      }
      setLastDataRefresh(new Date())
    } catch (err) {
      console.error("Error refreshing device states:", err)
    }
  }, [])

  return {
    deviceStates,
    automationEnabled,
    isLoading,
    lastDataRefresh,
    toggleFan,
    toggleHeat,
    togglePump,
    toggleAutomation,
    refreshStates,
  }
}
