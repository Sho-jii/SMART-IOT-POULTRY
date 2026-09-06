"use client"

import { useAuth } from "@/contexts/auth-context"
import NavigationMenu from "@/components/common/navigation-menu"
import LoadingAnimation from "@/components/common/loading-animation"
import { useWaterSchedule } from "../hooks/use-water-schedule"
import { WaterScheduleForm } from "./water-schedule-form"

export function WaterSchedulePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    schedule,
    settings,
    isLoading,
    isManualFilling,
    toggleWaterHour,
    updateFillDuration,
    updateFlowRate,
    toggleAutoWater,
    triggerManualFill,
  } = useWaterSchedule()

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
                Watering Schedule & Pump Calibration
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated solenoid refill intervals & flow parameters
              </p>
            </div>
          </header>

          <WaterScheduleForm
            schedule={schedule}
            settings={settings}
            isManualFilling={isManualFilling}
            onToggleHour={toggleWaterHour}
            onUpdateFillDuration={updateFillDuration}
            onUpdateFlowRate={updateFlowRate}
            onToggleAutoWater={toggleAutoWater}
            onTriggerManualFill={triggerManualFill}
          />
        </div>
      </main>
    </div>
  )
}
