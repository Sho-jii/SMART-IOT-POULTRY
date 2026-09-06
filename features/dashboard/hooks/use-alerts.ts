"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ref, onValue, get, remove, query, orderByChild, limitToLast } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { AlertsState, AlertEvent } from "../types"
import { TimeFilter } from "@/types"
import { toast } from "sonner"

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertsState>({
    highTemperature: false,
    lowTemperature: false,
    lowFood: false,
    lowWaterMain: false,
    lowWaterDrinker: false,
    lowHydration: false,
  })
  const [events, setEvents] = useState<AlertEvent[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("day")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})

  // Realtime active alerts listener (/alerts)
  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    try {
      const alertsRef = ref(firebase.database, "/alerts")
      const unsubscribe = onValue(
        alertsRef,
        (snapshot) => {
          const data = snapshot.val()
          if (data) {
            setAlerts({
              highTemperature: data.highTemperature === true || data.highTemperature === "true" || data.highTemperature === 1,
              lowTemperature: data.lowTemperature === true || data.lowTemperature === "true" || data.lowTemperature === 1,
              lowFood: data.lowFood === true || data.lowFood === "true" || data.lowFood === 1,
              lowWaterMain: data.lowWaterMain === true || data.lowWaterMain === "true" || data.lowWaterMain === 1,
              lowWaterDrinker: data.lowWaterDrinker === true || data.lowWaterDrinker === "true" || data.lowWaterDrinker === 1,
              lowHydration: data.lowHydration === true || data.lowHydration === "true" || data.lowHydration === 1,
            })
          }
        },
        (err) => console.error("Firebase alerts listener error:", err),
      )

      return () => unsubscribe()
    } catch (err) {
      console.error("Error setting up alerts listener:", err)
    }
  }, [])

  // Events listener (/events)
  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setIsLoading(false)
      return
    }

    try {
      const eventsRef = query(ref(firebase.database, "/events"), orderByChild("timestamp"), limitToLast(100))
      const unsubscribe = onValue(
        eventsRef,
        (snapshot) => {
          const data = snapshot.val()
          if (!data) {
            setEvents([])
            setIsLoading(false)
            return
          }

          const eventsArray: AlertEvent[] = Object.entries(data)
            .map(([key, value]: [string, any]) => ({
              id: key,
              ...value,
              timestamp: typeof value.timestamp === "string" ? Number(value.timestamp) : value.timestamp,
            }))
            .sort((a, b) => b.timestamp - a.timestamp)

          setEvents(eventsArray)
          setIsLoading(false)
        },
        (err) => {
          console.error("Firebase events listener error:", err)
          setIsLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err) {
      console.error("Error setting up events listener:", err)
      setIsLoading(false)
    }
  }, [])

  // Filter events based on time filter
  const filteredEvents = useMemo(() => {
    if (timeFilter === "all") return events

    const now = Math.floor(Date.now() / 1000)
    let cutoffTime = 0

    switch (timeFilter) {
      case "day": {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        cutoffTime = Math.floor(today.getTime() / 1000)
        break
      }
      case "week":
        cutoffTime = now - 7 * 24 * 60 * 60
        break
      case "month":
        cutoffTime = now - 30 * 24 * 60 * 60
        break
    }

    return events.filter((e) => e.timestamp >= cutoffTime)
  }, [events, timeFilter])

  const activeAlertCount = useMemo(() => {
    return Object.values(alerts).filter(Boolean).length
  }, [alerts])

  const deleteAlert = useCallback(async (id: string) => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    try {
      setIsDeleting((prev) => ({ ...prev, [id]: true }))
      await remove(ref(firebase.database, `/events/${id}`))
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success("Alert Dismissed")
    } catch (err) {
      console.error("Failed to delete alert:", err)
      toast.error("Failed to delete alert")
    } finally {
      setIsDeleting((prev) => ({ ...prev, [id]: false }))
    }
  }, [])

  const refreshAlerts = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    try {
      const snapshot = await get(ref(firebase.database, "/alerts"))
      const data = snapshot.val()
      if (data) {
        setAlerts({
          highTemperature: data.highTemperature === true || data.highTemperature === "true" || data.highTemperature === 1,
          lowTemperature: data.lowTemperature === true || data.lowTemperature === "true" || data.lowTemperature === 1,
          lowFood: data.lowFood === true || data.lowFood === "true" || data.lowFood === 1,
          lowWaterMain: data.lowWaterMain === true || data.lowWaterMain === "true" || data.lowWaterMain === 1,
          lowWaterDrinker: data.lowWaterDrinker === true || data.lowWaterDrinker === "true" || data.lowWaterDrinker === 1,
          lowHydration: data.lowHydration === true || data.lowHydration === "true" || data.lowHydration === 1,
        })
      }
    } catch (err) {
      console.error("Manual alerts refresh error:", err)
    }
  }, [])

  return {
    alerts,
    events: filteredEvents,
    rawEventsCount: events.length,
    activeAlertCount,
    timeFilter,
    setTimeFilter,
    isLoading,
    isDeleting,
    deleteAlert,
    refreshAlerts,
  }
}
