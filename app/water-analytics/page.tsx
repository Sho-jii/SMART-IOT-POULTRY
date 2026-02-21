"use client"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import LoadingAnimation from "@/components/loading-animation"
import WaterUsageAnalytics from "@/components/water-usage-analytics"
import WaterSchedule from "@/components/water-schedule"
import NavigationMenu from "@/components/navigation-menu"
import HydrationMonitor from "@/components/hydration-monitor"

export default function WaterAnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [chickenCount, setChickenCount] = useState(10)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return

    const firebase = initFirebase()
    if (!firebase?.database) return

    const settingsRef = ref(firebase.database, "/feedingSettings")
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const settings = snapshot.val()
      if (settings && settings.chickenCount) {
        setChickenCount(settings.chickenCount)
      }
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, authLoading])

  if (authLoading || isLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-300">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
          <header className="mb-8 animate-fade-in-up">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Water Usage Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor water consumption and hydration levels for your poultry
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
              <WaterUsageAnalytics />
            </div>
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
              <HydrationMonitor chickenCount={chickenCount} />
            </div>
          </div>

          <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <WaterSchedule />
          </div>
        </div>
      </main>
    </div>
  )
}
