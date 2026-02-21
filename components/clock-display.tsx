"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

export default function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
      <Clock size={14} className="text-muted-foreground" />
      <span className="text-muted-foreground hidden sm:inline">{formattedDate}</span>
      <span className="font-heading font-semibold text-foreground tabular-nums">{formattedTime}</span>
    </div>
  )
}
