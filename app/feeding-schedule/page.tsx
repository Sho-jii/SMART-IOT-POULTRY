"use client"

import { useEffect, useState } from "react"
import { ref, onValue, set } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import LoadingAnimation from "@/components/loading-animation"
import NavigationMenu from "@/components/navigation-menu"
import { Clock, Info } from "lucide-react"
import { toast } from "sonner"

export default function FeedingSchedulePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [feedingSchedule, setFeedingSchedule] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return

    const firebase = initFirebase()
    if (!firebase?.database) return

    const scheduleRef = ref(firebase.database, "/feedingSchedule")
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const schedule = snapshot.val()
      if (schedule) {
        const processedSchedule: { [key: string]: boolean } = {}
        Object.keys(schedule).forEach((key) => {
          const value = schedule[key]
          processedSchedule[key] = value === true || value === "true" || value === 1 || value === "1"
        })
        setFeedingSchedule(processedSchedule)
      } else {
        setFeedingSchedule({})
      }
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, authLoading])

  const toggleFeedingHour = (hour: number) => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    try {
      const newSchedule = { ...feedingSchedule }
      newSchedule[hour] = !newSchedule[hour]
      setFeedingSchedule(newSchedule)
      set(ref(firebase.database, `/feedingSchedule/${hour}`), newSchedule[hour])
        .then(() => toast.success(
          newSchedule[hour] ? `Feeding at ${hour}:00 Enabled` : `Feeding at ${hour}:00 Disabled`
        ))
        .catch((err) => {
          console.error("Error updating feeding schedule:", err)
          toast.error("Failed to update schedule")
        })
    } catch (err: any) {
      console.error("Error toggling feeding hour:", err)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-300">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
          <header className="mb-8 animate-fade-in-up">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Feeding Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">Set automatic feeding times throughout the day</p>
          </header>

          <div className="sensor-card overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 p-4 pb-3 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-sage flex items-center justify-center">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-foreground">Feeding Schedule</h2>
                <span className="text-xs text-muted-foreground">24-hour format</span>
              </div>
            </div>
            <div className="p-6">
              <p className="mb-6 text-sm text-muted-foreground">Click time slots to toggle automatic feeding:</p>

              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {Array.from({ length: 24 }).map((_, hour) => (
                  <button
                    key={hour}
                    className={`w-full h-12 rounded-lg text-xs font-medium transition-all duration-200 ${feedingSchedule[hour]
                      ? "bg-sage text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    onClick={() => toggleFeedingHour(hour)}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </button>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h3 className="font-heading text-sm font-medium text-primary mb-2 flex items-center gap-2">
                  <Info size={14} />
                  How it works
                </h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Click on a time slot to toggle automatic feeding at that hour</li>
                  <li>Highlighted slots indicate active feeding times</li>
                  <li>The system will dispense the recommended amount based on your chicken age group and count</li>
                  <li>Make sure your feed container has enough feed before scheduling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
