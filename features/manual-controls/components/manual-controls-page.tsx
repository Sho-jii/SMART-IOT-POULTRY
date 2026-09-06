"use client"

import { useAuth } from "@/contexts/auth-context"
import NavigationMenu from "@/components/common/navigation-menu"
import LoadingAnimation from "@/components/common/loading-animation"
import ClockDisplay from "@/components/common/clock-display"
import { useManualControls } from "../hooks/use-manual-controls"
import { ManualControlsPanel } from "./manual-controls-panel"
import { RefreshCw } from "lucide-react"

export function ManualControlsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    deviceStates,
    automationEnabled,
    isLoading,
    lastDataRefresh,
    toggleFan,
    toggleHeat,
    togglePump,
    toggleAutomation,
    refreshStates,
  } = useManualControls()

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
                Manual Hardware Controls
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Direct relay actuator switching & automation override
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ClockDisplay />
              <button
                onClick={refreshStates}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-muted font-medium text-xs shadow-sm transition-colors"
              >
                <RefreshCw size={14} className="text-muted-foreground" />
                <span className="hidden sm:inline">Refresh States</span>
              </button>
            </div>
          </header>

          <ManualControlsPanel
            deviceStates={deviceStates}
            automationEnabled={automationEnabled}
            lastDataRefresh={lastDataRefresh}
            onToggleFan={toggleFan}
            onToggleHeat={toggleHeat}
            onTogglePump={togglePump}
            onToggleAutomation={toggleAutomation}
            onRefresh={refreshStates}
          />
        </div>
      </main>
    </div>
  )
}
