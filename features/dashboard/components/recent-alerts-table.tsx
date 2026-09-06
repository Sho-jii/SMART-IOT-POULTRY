"use client"

import { useState } from "react"
import { AlertEvent } from "../types"
import { TimeFilter } from "@/types"
import {
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Utensils,
  Droplets,
  CheckCircle2,
  Info,
} from "lucide-react"

interface RecentAlertsTableProps {
  events: AlertEvent[]
  rawEventsCount: number
  timeFilter: TimeFilter
  onFilterChange: (filter: TimeFilter) => void
  onDeleteAlert: (id: string) => Promise<void>
  isDeleting: Record<string, boolean>
  isLoading: boolean
  className?: string
}

export function RecentAlertsTable({
  events,
  rawEventsCount,
  timeFilter,
  onFilterChange,
  onDeleteAlert,
  isDeleting,
  isLoading,
  className = "",
}: RecentAlertsTableProps) {
  const [showAll, setShowAll] = useState(false)
  const MAX_VISIBLE = 8

  const getEventIcon = (type: string) => {
    switch (type) {
      case "highTemperature":
      case "lowTemperature":
        return <Thermometer size={14} className="text-destructive" />
      case "lowFood":
        return <Utensils size={14} className="text-warning" />
      case "lowWaterMain":
      case "lowWaterDrinker":
      case "lowHydration":
        return <Droplets size={14} className="text-destructive" />
      case "feeding":
        return <CheckCircle2 size={14} className="text-accent" />
      default:
        return <Info size={14} className="text-muted-foreground" />
    }
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case "highTemperature":
      case "lowTemperature":
      case "lowWaterMain":
      case "lowWaterDrinker":
      case "lowHydration":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive">
            Critical
          </span>
        )
      case "lowFood":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/10 text-warning">
            Warning
          </span>
        )
      case "feeding":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent">
            Routine
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-muted text-muted-foreground">
            Info
          </span>
        )
    }
  }

  const getEventDescription = (event: AlertEvent) => {
    if (event.description) return event.description

    switch (event.type) {
      case "highTemperature":
        return "Temperature exceeded safe upper threshold (>32°C)"
      case "lowTemperature":
        return "Temperature fell below safe minimum (<24°C)"
      case "lowFood":
        return "Feeder hopper food level is critical (<20%)"
      case "lowWaterMain":
        return "Main water storage reservoir level low (<20%)"
      case "lowWaterDrinker":
        return "Broiler drinker water trough level low (<30%)"
      case "feeding":
        return "Automatic scheduled feeding cycle completed"
      default:
        return "System telemetry event logged"
    }
  }

  const visibleList = showAll ? events : events.slice(0, MAX_VISIBLE)

  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 shadow-sm ${className}`}>
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
            <AlertTriangle size={16} />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Event Log & Alert History
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time threshold breaches & automated actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-surface-muted border border-border">
            {(["day", "week", "month", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  timeFilter === filter
                    ? "bg-surface text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter === "day"
                  ? "Today"
                  : filter === "all"
                  ? "All"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-1">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-accent" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No alerts or system events recorded for this period.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleList.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-surface-muted/50 transition-colors group"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                        {getEventIcon(event.type)}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {getEventDescription(event)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">{getEventBadge(event.type)}</td>
                  <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                    {new Date(event.timestamp * 1000).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onDeleteAlert(event.id)}
                      disabled={isDeleting[event.id]}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-80 group-hover:opacity-100"
                      title="Dismiss alert"
                    >
                      {isDeleting[event.id] ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-destructive" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Show more/less button */}
      {events.length > MAX_VISIBLE && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center rounded-xl bg-surface-muted hover:bg-border transition-colors font-medium border border-border"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp size={14} className="ml-1" />
            </>
          ) : (
            <>
              View All Events ({events.length}) <ChevronDown size={14} className="ml-1" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
