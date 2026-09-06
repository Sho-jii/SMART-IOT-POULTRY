"use client"

import { Clock, CalendarClock, Info } from "lucide-react"
import { FeedingSchedule } from "../types"

interface FeedingScheduleFormProps {
  schedule: FeedingSchedule
  onToggleHour: (hour: number) => Promise<void>
  chickenCount?: number
  ageGroup?: string
  className?: string
}

export function FeedingScheduleForm({
  schedule,
  onToggleHour,
  chickenCount = 10,
  ageGroup = "adult",
  className = "",
}: FeedingScheduleFormProps) {
  const activeHours = Object.entries(schedule).filter(([_, active]) => active).map(([h]) => Number(h))
  const currentHour = new Date().getHours()

  // Find next scheduled hour
  const sortedActive = [...activeHours].sort((a, b) => a - b)
  const nextHour = sortedActive.find((h) => h > currentHour) ?? sortedActive[0]

  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
            <CalendarClock size={16} />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              24-Hour Feeding Schedule
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure automated motorized dispensing times
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Active Cycles:{" "}
            <span className="font-bold text-foreground tabular-nums">
              {activeHours.length} times/day
            </span>
          </span>
          {nextHour !== undefined && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent">
              Next: {nextHour.toString().padStart(2, "0")}:00
            </span>
          )}
        </div>
      </div>

      {/* Grid of 24 hours */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-3">
          Click any hour box to activate or deactivate scheduled feeding:
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {Array.from({ length: 24 }).map((_, hour) => {
            const isActive = !!schedule[hour]
            const isCurrent = hour === currentHour

            return (
              <button
                key={hour}
                onClick={() => onToggleHour(hour)}
                className={`h-14 rounded-xl flex flex-col items-center justify-center transition-all text-xs border ${
                  isActive
                    ? "bg-accent text-accent-foreground border-accent font-semibold shadow-sm"
                    : "bg-surface-muted text-muted-foreground border-border hover:text-foreground hover:bg-border/60"
                } ${isCurrent ? "ring-2 ring-foreground/20 ring-offset-1" : ""}`}
              >
                <span className="tabular-nums font-bold text-sm">
                  {hour.toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] opacity-80">:00</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Advisory Info Note */}
      <div className="p-4 rounded-xl bg-surface-muted border border-border flex items-start gap-3 text-xs text-muted-foreground">
        <Info size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground block mb-0.5">
            Automatic Schedule Dispatch Rules
          </span>
          <span>
            When a scheduled hour is reached, the microcontroller dispenses the calculated volume
            for {chickenCount} {ageGroup} chickens and logs the event automatically to Firebase.
          </span>
        </div>
      </div>
    </div>
  )
}
