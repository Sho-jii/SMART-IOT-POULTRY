"use client"

import { useAuth } from "@/contexts/auth-context"
import NavigationMenu from "@/components/common/navigation-menu"
import ClockDisplay from "@/components/common/clock-display"
import LoadingAnimation from "@/components/common/loading-animation"
import { useSensorData } from "../hooks/use-sensor-data"
import { useAlerts } from "../hooks/use-alerts"
import { useAutomationState } from "../hooks/use-automation-state"
import { SensorCard } from "./sensor-card"
import { FarmStatusCard } from "./farm-status-card"
import { CameraFeedCard } from "./camera-feed-card"
import { HistoricalChart } from "./historical-chart"
import { RecentAlertsTable } from "./recent-alerts-table"
import {
  TEMP_HIGH_THRESHOLD,
  TEMP_LOW_THRESHOLD,
  FOOD_CRITICAL_LOW_THRESHOLD,
  FOOD_MEDIUM_THRESHOLD,
  WATER_MAIN_LOW_THRESHOLD,
  WATER_DRINKER_LOW_THRESHOLD,
} from "@/config/alert-thresholds"
import {
  Thermometer,
  Droplets,
  Utensils,
  FlaskConical,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

export function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const sensorData = useSensorData()
  const alertsData = useAlerts()
  const automationData = useAutomationState()

  if (authLoading || sensorData.isLoading) {
    return <LoadingAnimation />
  }

  if (sensorData.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="bg-surface rounded-2xl border border-border p-8 max-w-md w-full text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 text-destructive mb-4">
            <AlertTriangle size={24} />
          </div>
          <h1 className="font-heading text-lg font-bold text-foreground mb-1">
            Telemetry Stream Unavailable
          </h1>
          <p className="text-xs text-muted-foreground mb-6">{sensorData.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Determine temperature status
  const getTempStatus = () => {
    const { temperature } = sensorData
    if (temperature === null) return { status: "normal" as const, text: "No Data" }
    if (temperature > TEMP_HIGH_THRESHOLD) return { status: "destructive" as const, text: "High Alert" }
    if (temperature < TEMP_LOW_THRESHOLD) return { status: "destructive" as const, text: "Low Alert" }
    return { status: "accent" as const, text: "Optimal" }
  }

  // Determine food status
  const getFoodStatus = () => {
    const { foodLevel } = sensorData
    if (foodLevel === null) return { status: "normal" as const, text: "N/A" }
    if (foodLevel < FOOD_CRITICAL_LOW_THRESHOLD) return { status: "destructive" as const, text: "Critical Low" }
    if (foodLevel < FOOD_MEDIUM_THRESHOLD) return { status: "warning" as const, text: "Medium" }
    return { status: "accent" as const, text: "Good" }
  }

  const tempStatus = getTempStatus()
  const foodStatus = getFoodStatus()

  const handleGlobalRefresh = async () => {
    await Promise.all([
      sensorData.refreshSensors(),
      alertsData.refreshAlerts(),
      automationData.refreshAutomationState(),
    ])
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-200">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">

          {/* Top Bar / Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
                Farm Telemetry Overview
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time environmental monitoring & automation hub
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ClockDisplay />
              <button
                onClick={handleGlobalRefresh}
                disabled={sensorData.isRefreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-muted font-medium text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={sensorData.isRefreshing ? "animate-spin text-accent" : "text-muted-foreground"}
                />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
            </div>
          </header>

          {/* Top Row: System Status Summary & Live Camera Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FarmStatusCard
              isConnected={!sensorData.error}
              activeAlertCount={alertsData.activeAlertCount}
              lastUpdated={sensorData.lastUpdated}
              automationEnabled={automationData.automationEnabled}
              isRefreshing={sensorData.isRefreshing}
              onRefresh={handleGlobalRefresh}
              onToggleAutomation={automationData.toggleAutomation}
            />
            <CameraFeedCard />
          </div>

          {/* 4 Sensor Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperature */}
            <SensorCard
              title="Broiler Temperature"
              subtitle="Target: 24°C – 32°C"
              value={sensorData.temperature !== null ? sensorData.temperature.toFixed(1) : "--"}
              unit="°C"
              icon={Thermometer}
              statusText={tempStatus.text}
              statusType={tempStatus.status}
              progressPercent={
                sensorData.temperature !== null ? (sensorData.temperature / 50) * 100 : 0
              }
              alertMessage={
                alertsData.alerts.highTemperature
                  ? "Upper threshold exceeded (>32°C)"
                  : alertsData.alerts.lowTemperature
                  ? "Lower threshold breached (<24°C)"
                  : undefined
              }
            />

            {/* Humidity */}
            <SensorCard
              title="Relative Humidity"
              subtitle="Target: 50% – 70%"
              value={sensorData.humidity !== null ? sensorData.humidity.toFixed(1) : "--"}
              unit="%"
              icon={Droplets}
              statusText="Monitored"
              statusType="normal"
              progressPercent={sensorData.humidity !== null ? sensorData.humidity : 0}
            />

            {/* Food Level */}
            <SensorCard
              title="Feeder Hopper Level"
              subtitle="Ultrasonic volume level"
              value={sensorData.foodLevel !== null ? sensorData.foodLevel : "--"}
              unit="%"
              icon={Utensils}
              statusText={foodStatus.text}
              statusType={foodStatus.status}
              progressPercent={sensorData.foodLevel !== null ? sensorData.foodLevel : 0}
              alertMessage={
                alertsData.alerts.lowFood ? "Critical food level (<20%)" : undefined
              }
            />

            {/* Water Tank Levels */}
            <SensorCard
              title="Water Reservoir & Drinker"
              subtitle="Dual capacitive sensors"
              value={sensorData.waterLevelMain !== null ? sensorData.waterLevelMain : "--"}
              unit="% Main"
              icon={FlaskConical}
              statusText={
                sensorData.waterLevelMain !== null && sensorData.waterLevelMain < WATER_MAIN_LOW_THRESHOLD
                  ? "Low Tank"
                  : "Optimal"
              }
              statusType={
                sensorData.waterLevelMain !== null && sensorData.waterLevelMain < WATER_MAIN_LOW_THRESHOLD
                  ? "destructive"
                  : "accent"
              }
              footer={
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Drinker Level</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {sensorData.waterLevelDrinker !== null ? `${sensorData.waterLevelDrinker}%` : "--"}
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${
                        sensorData.waterLevelDrinker !== null &&
                        sensorData.waterLevelDrinker < WATER_DRINKER_LOW_THRESHOLD
                          ? "bg-destructive"
                          : "bg-accent"
                      }`}
                      style={{
                        width: `${
                          sensorData.waterLevelDrinker !== null ? sensorData.waterLevelDrinker : 0
                        }%`,
                      }}
                    />
                  </div>
                  {(alertsData.alerts.lowWaterMain ||
                    alertsData.alerts.lowWaterDrinker ||
                    alertsData.alerts.lowHydration) && (
                    <p className="text-[11px] text-destructive font-medium mt-1">
                      {alertsData.alerts.lowWaterMain
                        ? "Main tank low"
                        : alertsData.alerts.lowWaterDrinker
                        ? "Drinker water low"
                        : "Hydration low"}
                    </p>
                  )}
                </div>
              }
            />
          </div>

          {/* Historical Trends Chart */}
          <HistoricalChart />

          {/* Event Log & Recent Alerts Table */}
          <RecentAlertsTable
            events={alertsData.events}
            rawEventsCount={alertsData.rawEventsCount}
            timeFilter={alertsData.timeFilter}
            onFilterChange={alertsData.setTimeFilter}
            onDeleteAlert={alertsData.deleteAlert}
            isDeleting={alertsData.isDeleting}
            isLoading={alertsData.isLoading}
          />
        </div>
      </main>
    </div>
  )
}
