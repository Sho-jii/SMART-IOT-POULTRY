"use client"

import { useState, useEffect } from "react"
import { ref, onValue } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { useAuth } from "@/contexts/auth-context"
import NavigationMenu from "@/components/common/navigation-menu"
import LoadingAnimation from "@/components/common/loading-animation"
import { WaterUsageAnalytics } from "./water-usage-analytics"
import { HydrationMonitor } from "./hydration-monitor"

export function WaterAnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [chickenCount, setChickenCount] = useState(10)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const settingsRef = ref(firebase.database, "/feedingSettings")
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const settings = snapshot.val()
      if (settings?.chickenCount) {
        setChickenCount(Number(settings.chickenCount))
      }
    })

    return () => unsubscribe()
  }, [])

  if (authLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-200">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
                Water Telemetry & Hydration
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Flock water consumption volume & hydration index
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WaterUsageAnalytics />
            <HydrationMonitor chickenCount={chickenCount} />
          </div>
        </div>
      </main>
    </div>
  )
}
