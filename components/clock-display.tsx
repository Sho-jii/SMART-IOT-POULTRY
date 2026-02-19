"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"

export default function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Format date: Monday, January 1, 2023
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format time: 12:34:56 PM
  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1">
        <Calendar size={16} className="mr-2" />
        <span className="text-sm">{formattedDate}</span>
      </div>
      <div className="flex items-center text-gray-900 dark:text-white font-medium">
        <Clock size={18} className="mr-2" />
        <span className="text-lg">{formattedTime}</span>
      </div>
    </div>
  )
}
