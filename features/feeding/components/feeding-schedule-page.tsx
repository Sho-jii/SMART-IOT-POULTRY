"use client"

import { useAuth } from "@/contexts/auth-context"
import NavigationMenu from "@/components/common/navigation-menu"
import LoadingAnimation from "@/components/common/loading-animation"
import { useFeedingSchedule } from "../hooks/use-feeding-schedule"
import { FeedingScheduleForm } from "./feeding-schedule-form"

export function FeedingSchedulePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { schedule, settings, isLoading, toggleFeedingHour } = useFeedingSchedule()

  if (authLoading || isLoading) {
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
                Feeding Schedule Configuration
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated daily dispensation intervals
              </p>
            </div>
          </header>

          <FeedingScheduleForm
            schedule={schedule}
            onToggleHour={toggleFeedingHour}
            chickenCount={settings.chickenCount}
            ageGroup={settings.ageGroup}
          />
        </div>
      </main>
    </div>
  )
}
