"use client"

import { useState, useEffect, useCallback } from "react"
import { ref, onValue, set, get } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { toast } from "sonner"

export function useAutomationState() {
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setIsLoading(false)
      return
    }

    try {
      const automationRef = ref(firebase.database, "/controls/automationEnabled")
      const unsubscribe = onValue(
        automationRef,
        (snapshot) => {
          const enabled = snapshot.val()
          setAutomationEnabled(enabled === true || enabled === "true" || enabled === 1 || enabled === "1")
          setIsLoading(false)
        },
        (err) => {
          console.error("Firebase automation state listener error:", err)
          setIsLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err) {
      console.error("Error setting up automation state listener:", err)
      setIsLoading(false)
    }
  }, [])

  const toggleAutomation = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const nextState = !automationEnabled
    setAutomationEnabled(nextState)

    try {
      await set(ref(firebase.database, "/controls/automationEnabled"), nextState)
      toast.info(nextState ? "Automation Enabled" : "Automation Disabled", {
        description: nextState ? "System will control devices automatically" : "Manual control mode active",
      })
    } catch (err) {
      console.error("Error toggling automation state:", err)
      toast.error("Failed to toggle automation state")
      setAutomationEnabled(!nextState) // Revert on failure
    }
  }, [automationEnabled])

  const refreshAutomationState = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    try {
      const snapshot = await get(ref(firebase.database, "/controls/automationEnabled"))
      const val = snapshot.val()
      if (val !== null) {
        setAutomationEnabled(val === true || val === "true" || val === 1 || val === "1")
      }
    } catch (err) {
      console.error("Error refreshing automation state:", err)
    }
  }, [])

  return {
    automationEnabled,
    isLoading,
    toggleAutomation,
    refreshAutomationState,
  }
}
