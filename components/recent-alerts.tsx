"use client"

import { useEffect, useState } from "react"
import { ref, onValue, remove, query, limitToLast, orderByChild } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface AlertEvent {
  id: string
  timestamp: number
  type: string
  description: string
}

interface RecentAlertsProps {
  className?: string
}

export default function RecentAlerts({ className = "" }: RecentAlertsProps) {
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<AlertEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [timeFilter, setTimeFilter] = useState<"day" | "week" | "month" | "all">("day")
  const [showAll, setShowAll] = useState(false)
  const MAX_VISIBLE_ITEMS = 15

  // Load alert events from Firebase
  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Firebase not initialized")
      setIsLoading(false)
      return
    }

    try {
      const eventsRef = query(ref(firebase.database, "/events"), orderByChild("timestamp"), limitToLast(100))

      const unsubscribe = onValue(
        eventsRef,
        (snapshot) => {
          const events = snapshot.val()

          if (!events) {
            setAlertEvents([])
            setFilteredEvents([])
            setIsLoading(false)
            return
          }

          const eventsArray = Object.entries(events)
            .map(([key, value]: [string, any]) => ({
              id: key,
              ...value,
              timestamp: typeof value.timestamp === "string" ? Number(value.timestamp) : value.timestamp,
            }))
            .sort((a, b) => b.timestamp - a.timestamp)

          setAlertEvents(eventsArray)
          applyTimeFilter(eventsArray, timeFilter)
          setIsLoading(false)
        },
        (error) => {
          console.error("Firebase events error:", error)
          setError(`Failed to fetch alerts: ${error.message}`)
          setIsLoading(false)
        },
      )

      return () => {
        unsubscribe()
      }
    } catch (err: any) {
      console.error("Error setting up events listener:", err)
      setError(`Error: ${err.message}`)
      setIsLoading(false)
    }
  }, [])

  const applyTimeFilter = (events: AlertEvent[], filter: "day" | "week" | "month" | "all") => {
    if (filter === "all") {
      setFilteredEvents(events)
      return
    }

    const now = Math.floor(Date.now() / 1000)
    let cutoffTime: number

    switch (filter) {
      case "day":
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        cutoffTime = Math.floor(today.getTime() / 1000)
        break
      case "week":
        cutoffTime = now - 7 * 24 * 60 * 60
        break
      case "month":
        cutoffTime = now - 30 * 24 * 60 * 60
        break
      default:
        cutoffTime = 0
    }

    const filtered = events.filter((event) => event.timestamp >= cutoffTime)
    setFilteredEvents(filtered)
  }

  const handleFilterChange = (filter: "day" | "week" | "month" | "all") => {
    setTimeFilter(filter)
    applyTimeFilter(alertEvents, filter)
  }

  const deleteAlert = async (id: string) => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      console.error("Firebase not initialized")
      return
    }

    try {
      setIsDeleting((prev) => ({ ...prev, [id]: true }))
      await remove(ref(firebase.database, `/events/${id}`))
      setAlertEvents((prev) => prev.filter((event) => event.id !== id))
      setFilteredEvents((prev) => prev.filter((event) => event.id !== id))
      toast.success("Alert Dismissed")
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast.error("Failed to delete alert")
    } finally {
      setIsDeleting((prev) => ({ ...prev, [id]: false }))
    }
  }

  const toggleShowAll = () => {
    setShowAll(!showAll)
  }

  const getDescriptionFromType = (event: AlertEvent) => {
    if (event.description) return event.description

    switch (event.type) {
      case "highTemperature":
        return "Temperature exceeded safe threshold"
      case "lowTemperature":
        return "Temperature below safe threshold"
      case "lowFood":
        return "Food level is low"
      case "lowWaterMain":
        return "Main water tank level is low"
      case "lowWaterDrinker":
        return "Drinker water level is low"
      case "feeding":
        return "Automatic feeding activated"
      default:
        return "System event"
    }
  }

  const getStatusBadgeClass = (type: string) => {
    switch (type) {
      case "highTemperature":
      case "lowTemperature":
      case "lowFood":
      case "lowWaterMain":
      case "lowWaterDrinker":
        return "bg-brick/15 text-brick border border-brick/30"
      case "feeding":
        return "bg-sage/15 text-sage border border-sage/30"
      default:
        return "bg-muted text-muted-foreground border border-border/30"
    }
  }

  const getStatusText = (type: string) => {
    switch (type) {
      case "highTemperature":
      case "lowTemperature":
      case "lowFood":
      case "lowWaterMain":
      case "lowWaterDrinker":
        return "Alert"
      case "feeding":
        return "Success"
      default:
        return "Info"
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const visibleEvents = showAll ? filteredEvents : filteredEvents.slice(0, MAX_VISIBLE_ITEMS)

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm p-4 border-b border-border/50">
        <h2 className="font-heading text-lg font-semibold flex items-center text-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center mr-3">
            <AlertTriangle size={16} className="text-white" />
          </div>
          Recent Alerts & Events
        </h2>
      </div>

      {/* Filter controls */}
      <div className="bg-muted/30 px-4 py-2.5 flex justify-between items-center border-b border-border/30">
        <div className="flex gap-1.5">
          {(["day", "week", "month", "all"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${timeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {filter === "day" ? "Today" : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
          </div>
        ) : error ? (
          <div className="text-brick text-center p-4 text-sm">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-muted-foreground text-center p-8 text-sm">No recent alerts or events</div>
        ) : (
          <div>
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
              {visibleEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="py-3 flex items-start animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className={`${getStatusBadgeClass(event.type)} text-xs font-medium px-2 py-1 rounded-lg mr-3 mt-0.5`}
                  >
                    {getStatusText(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{getDescriptionFromType(event)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatTimestamp(event.timestamp)}</div>
                  </div>
                  <button
                    onClick={() => deleteAlert(event.id)}
                    disabled={isDeleting[event.id]}
                    className="text-muted-foreground hover:text-brick transition-colors p-1.5 rounded-lg hover:bg-brick/10 flex-shrink-0 ml-2"
                    title="Delete alert"
                  >
                    {isDeleting[event.id] ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Show more/less button */}
            {filteredEvents.length > MAX_VISIBLE_ITEMS && (
              <button
                onClick={toggleShowAll}
                className="mt-4 w-full py-2.5 text-sm text-primary hover:text-primary/80 flex items-center justify-center rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors font-medium"
              >
                {showAll ? (
                  <>
                    Show Less <ChevronUp size={16} className="ml-1" />
                  </>
                ) : (
                  <>
                    Show All ({filteredEvents.length}) <ChevronDown size={16} className="ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
