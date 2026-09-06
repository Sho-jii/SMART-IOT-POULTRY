"use client"

import type React from "react"
import { LucideIcon } from "lucide-react"

interface SensorCardProps {
  title: string
  subtitle?: string
  value: string | number
  unit?: string
  icon: LucideIcon
  statusText?: string
  statusType?: "normal" | "accent" | "warning" | "destructive"
  progressPercent?: number
  alertMessage?: string
  footer?: React.ReactNode
  className?: string
}

export function SensorCard({
  title,
  subtitle,
  value,
  unit,
  icon: Icon,
  statusText,
  statusType = "normal",
  progressPercent,
  alertMessage,
  footer,
  className = "",
}: SensorCardProps) {
  const isAlert = statusType === "destructive" || !!alertMessage

  const getStatusBadgeStyle = () => {
    switch (statusType) {
      case "destructive":
        return "bg-destructive/10 text-destructive"
      case "warning":
        return "bg-warning/10 text-warning"
      case "accent":
        return "bg-accent/10 text-accent"
      default:
        return "bg-surface-muted text-muted-foreground"
    }
  }

  return (
    <div
      className={`bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between transition-colors ${className}`}
    >
      {/* Header: Title + Icon */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isAlert ? "bg-destructive/10 text-destructive" : "bg-surface-muted text-muted-foreground"
          }`}
        >
          <Icon size={18} />
        </div>
      </div>

      {/* Main Metric Value & Status Pill */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="flex items-baseline">
          <span className="font-heading text-3xl md:text-4xl font-bold text-foreground tabular-nums tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1.5">{unit}</span>
          )}
        </div>
        {statusText && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadgeStyle()}`}
          >
            {statusText}
          </span>
        )}
      </div>

      {/* Optional Progress bar */}
      {progressPercent !== undefined && (
        <div className="mt-4">
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${
                isAlert ? "bg-destructive" : "bg-accent"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      {/* Optional Alert Message */}
      {alertMessage && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-destructive">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Custom footer section (e.g. dual sub-bars) */}
      {footer && <div className="mt-4 pt-3 border-t border-border">{footer}</div>}
    </div>
  )
}
