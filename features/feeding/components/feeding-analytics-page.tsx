"use client"

import { useAuth } from "@/contexts/auth-context"
import NavigationMenu from "@/components/common/navigation-menu"
import LoadingAnimation from "@/components/common/loading-animation"
import { FeedingControl } from "./feeding-control"
import { FeedingAnalyticsCharts } from "./feeding-analytics-charts"

export function FeedingAnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

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
                Feeding Management & Analytics
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Flock feed distribution, manual actuators & consumption tracking
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeedingControl />
            <FeedingAnalyticsCharts />
          </div>
        </div>
      </main>
    </div>
  )
}
