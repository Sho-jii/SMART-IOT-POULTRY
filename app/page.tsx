"use client"

import { useEffect, useState } from "react"
import { ref, onValue, get } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import LoadingAnimation from "@/components/loading-animation"
import CameraFeed from "@/components/camera-feed"
import HistoricalChart from "@/components/historical-chart"
import RecentAlerts from "@/components/recent-alerts"
import NavigationMenu from "@/components/navigation-menu"
import ClockDisplay from "@/components/clock-display"
import {
  RefreshCw,
  Thermometer,
  Droplets,
  Utensils,
  FlaskConical,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react"

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [firebase, setFirebase] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [temperature, setTemperature] = useState<number | null>(null)
  const [humidity, setHumidity] = useState<number | null>(null)
  const [foodLevel, setFoodLevel] = useState<number | null>(null)
  const [waterLevelMain, setWaterLevelMain] = useState<number | null>(null)
  const [waterLevelDrinker, setWaterLevelDrinker] = useState<number | null>(null)
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [alerts, setAlerts] = useState<{
    highTemperature: boolean
    lowTemperature: boolean
    lowFood: boolean
    lowWaterMain: boolean
    lowWaterDrinker: boolean
    lowHydration: boolean
  }>({
    highTemperature: false,
    lowTemperature: false,
    lowFood: false,
    lowWaterMain: false,
    lowWaterDrinker: false,
    lowHydration: false,
  })

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      return
    }

    try {
      const firebaseInstance = initFirebase()
      if (firebaseInstance) {
        setFirebase(firebaseInstance)
      } else {
        setError("Failed to initialize Firebase. Browser environment required.")
      }
    } catch (err: any) {
      console.error("Firebase initialization error:", err)
      setError("Failed to initialize Firebase. Please check your connection.")
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    }
  }, [isAuthenticated, authLoading])

  const refreshData = () => {
    if (!firebase?.database) {
      return
    }

    setIsRefreshing(true)

    const sensorsRef = ref(firebase.database, "/sensors")
    get(sensorsRef)
      .then((snapshot) => {
        const data = snapshot.val()

        if (data) {
          if (data.temperature !== undefined) {
            const tempValue = Number(data.temperature)
            setTemperature(isNaN(tempValue) ? null : tempValue)
          }

          if (data.humidity !== undefined) {
            const humValue = Number(data.humidity)
            setHumidity(isNaN(humValue) ? null : humValue)
          }

          if (data.foodLevel !== undefined) {
            const foodValue = Number(data.foodLevel)
            setFoodLevel(isNaN(foodValue) ? null : foodValue)
          }

          if (data.waterLevelMain !== undefined) {
            const waterMainValue = Number(data.waterLevelMain)
            setWaterLevelMain(isNaN(waterMainValue) ? null : waterMainValue)
          }

          if (data.waterLevelDrinker !== undefined) {
            const waterDrinkerValue = Number(data.waterLevelDrinker)
            setWaterLevelDrinker(isNaN(waterDrinkerValue) ? null : waterDrinkerValue)
          }
        }

        const alertsRef = ref(firebase.database, "/alerts")
        return get(alertsRef)
      })
      .then((snapshot) => {
        const data = snapshot.val()

        if (data) {
          setAlerts({
            highTemperature:
              data.highTemperature === true || data.highTemperature === "true" || data.highTemperature === 1,
            lowTemperature: data.lowTemperature === true || data.lowTemperature === "true" || data.lowTemperature === 1,
            lowFood: data.lowFood === true || data.lowFood === "true" || data.lowFood === 1,
            lowWaterMain: data.lowWaterMain === true || data.lowWaterMain === "true" || data.lowWaterMain === 1,
            lowWaterDrinker:
              data.lowWaterDrinker === true || data.lowWaterDrinker === "true" || data.lowWaterDrinker === 1,
            lowHydration: data.lowHydration === true || data.lowHydration === "true" || data.lowHydration === 1,
          })
        }

        const controlsRef = ref(firebase.database, "/controls")
        return get(controlsRef)
      })
      .then((snapshot) => {
        const data = snapshot.val()

        if (data && data.automationEnabled !== undefined) {
          const autoValue =
            data.automationEnabled === true ||
            data.automationEnabled === "true" ||
            data.automationEnabled === 1 ||
            data.automationEnabled === "1"
          setAutomationEnabled(autoValue)
        }

        setLastDataRefresh(new Date())
        setIsRefreshing(false)
      })
      .catch((error) => {
        console.error("Manual refresh error:", error)
        setIsRefreshing(false)
      })
  }

  useEffect(() => {
    if (!firebase?.database) {
      return
    }

    try {
      const sensorsRef = ref(firebase.database, "/sensors")

      const unsubscribe = onValue(
        sensorsRef,
        (snapshot) => {
          const data = snapshot.val()

          if (!data) {
            return
          }

          if (data.temperature !== undefined) {
            const tempValue = Number(data.temperature)
            if (!isNaN(tempValue)) {
              setTemperature(tempValue)
            }
          }

          if (data.humidity !== undefined) {
            const humValue = Number(data.humidity)
            if (!isNaN(humValue)) {
              setHumidity(humValue)
            }
          }

          if (data.foodLevel !== undefined) {
            const foodValue = Number(data.foodLevel)
            if (!isNaN(foodValue)) {
              setFoodLevel(foodValue)
            }
          }

          if (data.waterLevelMain !== undefined) {
            const waterMainValue = Number(data.waterLevelMain)
            if (!isNaN(waterMainValue)) {
              setWaterLevelMain(waterMainValue)
            }
          }

          if (data.waterLevelDrinker !== undefined) {
            const waterDrinkerValue = Number(data.waterLevelDrinker)
            if (!isNaN(waterDrinkerValue)) {
              setWaterLevelDrinker(waterDrinkerValue)
            }
          }

          setLastDataRefresh(new Date())
        },
        (error) => {
          console.error("Firebase sensors data error:", error)
        },
      )

      return () => {
        unsubscribe()
      }
    } catch (err: any) {
      console.error("Error setting up sensors listener:", err)
    }
  }, [firebase])

  useEffect(() => {
    if (!firebase?.database) {
      return
    }

    try {
      const alertsRef = ref(firebase.database, "/alerts")

      const unsubscribe = onValue(
        alertsRef,
        (snapshot) => {
          const data = snapshot.val()

          if (!data) {
            return
          }

          setAlerts({
            highTemperature:
              data.highTemperature === true || data.highTemperature === "true" || data.highTemperature === 1,
            lowTemperature: data.lowTemperature === true || data.lowTemperature === "true" || data.lowTemperature === 1,
            lowFood: data.lowFood === true || data.lowFood === "true" || data.lowFood === 1,
            lowWaterMain: data.lowWaterMain === true || data.lowWaterMain === "true" || data.lowWaterMain === 1,
            lowWaterDrinker:
              data.lowWaterDrinker === true || data.lowWaterDrinker === "true" || data.lowWaterDrinker === 1,
            lowHydration: data.lowHydration === true || data.lowHydration === "true" || data.lowHydration === 1,
          })

          setLastDataRefresh(new Date())
        },
        (error) => {
          console.error("Firebase alerts error:", error)
        },
      )

      return () => {
        unsubscribe()
      }
    } catch (err: any) {
      console.error("Error setting up alerts listener:", err)
    }
  }, [firebase])

  useEffect(() => {
    if (!firebase?.database) {
      return
    }

    try {
      const automationRef = ref(firebase.database, "/controls/automationEnabled")

      const unsubscribe = onValue(
        automationRef,
        (snapshot) => {
          const enabled = snapshot.val()
          const automationValue = enabled === true || enabled === "true" || enabled === 1 || enabled === "1"
          setAutomationEnabled(automationValue)
        },
        (error) => {
          console.error("Firebase automation state error:", error)
        },
      )

      return () => {
        unsubscribe()
      }
    } catch (err: any) {
      console.error("Error setting up automation state listener:", err)
    }
  }, [firebase])

  // Helper: get temperature color/status
  const getTempStatus = () => {
    if (temperature === null) return { color: "text-muted-foreground", bg: "bg-muted", label: "No Data" }
    if (temperature > 32) return { color: "text-brick", bg: "bg-brick/10", label: "High" }
    if (temperature < 24) return { color: "text-pond", bg: "bg-pond/10", label: "Low" }
    return { color: "text-sage", bg: "bg-sage/10", label: "Optimal" }
  }

  if (authLoading || isLoading) {
    return <LoadingAnimation />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="glass-card-elevated p-8 max-w-md w-full mx-4 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Connection Error</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 rounded-lg bg-gradient-warm text-white font-heading font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-copper/20"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const tempStatus = getTempStatus()
  const activeAlertCount = Object.values(alerts).filter(Boolean).length

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <NavigationMenu />

      {/* Main content — pushed right by sidebar on desktop */}
      <main className="sidebar-content transition-all duration-300">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">

          {/* ====== HEADER ====== */}
          <header className="mb-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                  Farm Overview
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Real-time monitoring dashboard
                  </p>
                  {/* Connection badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${firebase ? "bg-sage/10 text-sage dark:text-sage-light" : "bg-destructive/10 text-destructive"
                    }`}>
                    {firebase ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {firebase ? "Connected" : "Offline"}
                  </div>
                  {/* Alert count badge */}
                  {activeAlertCount > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      {activeAlertCount} Alert{activeAlertCount > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                {lastDataRefresh && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {lastDataRefresh.toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <ClockDisplay />
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </header>

          {/* ====== SENSOR CARDS GRID ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Camera Feed */}
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <CameraFeed />
            </div>

            {/* Sensor cards 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Temperature Card */}
              <div className="sensor-card opacity-0 animate-fade-in-up" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
                <div className={`flex items-center gap-3 p-4 pb-3 border-b border-border/50 ${(alerts.highTemperature || alerts.lowTemperature) ? "bg-destructive/5" : ""
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(alerts.highTemperature || alerts.lowTemperature)
                    ? "bg-destructive/10"
                    : "bg-gradient-warm"
                    }`}>
                    <Thermometer size={20} className={
                      (alerts.highTemperature || alerts.lowTemperature) ? "text-destructive" : "text-white"
                    } />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">Temperature</h3>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${tempStatus.bg} ${tempStatus.color}`}>
                      {tempStatus.label}
                    </span>
                  </div>
                </div>
                <div className="p-4 pt-3">
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-heading text-3xl font-bold text-foreground animate-number-slide">
                      {temperature !== null ? temperature.toFixed(1) : "--"}
                    </span>
                    <span className="text-sm text-muted-foreground">°C</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill progress-fill-temp"
                      style={{ width: `${temperature !== null ? Math.min(100, (temperature / 50) * 100) : 0}%` }}
                    />
                  </div>
                  {(alerts.highTemperature || alerts.lowTemperature) && (
                    <p className="mt-2 text-xs text-destructive font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      {alerts.highTemperature ? "High temperature alert!" : "Low temperature alert!"}
                    </p>
                  )}
                </div>
              </div>

              {/* Humidity Card */}
              <div className="sensor-card opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 p-4 pb-3 border-b border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-water flex items-center justify-center">
                    <Droplets size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">Humidity</h3>
                    <span className="text-xs text-muted-foreground">Relative %</span>
                  </div>
                </div>
                <div className="p-4 pt-3">
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-heading text-3xl font-bold text-foreground animate-number-slide">
                      {humidity !== null ? humidity.toFixed(1) : "--"}
                    </span>
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill progress-fill-humidity"
                      style={{ width: `${humidity !== null ? humidity : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Food Level Card */}
              <div className="sensor-card opacity-0 animate-fade-in-up" style={{ animationDelay: "250ms", animationFillMode: "forwards" }}>
                <div className={`flex items-center gap-3 p-4 pb-3 border-b border-border/50 ${alerts.lowFood ? "bg-destructive/5" : ""
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alerts.lowFood ? "bg-destructive/10" : "bg-gradient-sage"
                    }`}>
                    <Utensils size={20} className={alerts.lowFood ? "text-destructive" : "text-white"} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">Food Level</h3>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${alerts.lowFood ? "bg-destructive/10 text-destructive" : "bg-sage/10 text-sage dark:text-sage-light"
                      }`}>
                      {foodLevel !== null ? (foodLevel < 20 ? "Low" : foodLevel < 50 ? "Medium" : "Good") : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="p-4 pt-3">
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-heading text-3xl font-bold text-foreground animate-number-slide">
                      {foodLevel !== null ? foodLevel : "--"}
                    </span>
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill progress-fill-food"
                      style={{ width: `${foodLevel !== null ? foodLevel : 0}%` }}
                    />
                  </div>
                  {alerts.lowFood && (
                    <p className="mt-2 text-xs text-destructive font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      Low food level alert!
                    </p>
                  )}
                </div>
              </div>

              {/* Water Levels Card */}
              <div className="sensor-card opacity-0 animate-fade-in-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
                <div className={`flex items-center gap-3 p-4 pb-3 border-b border-border/50 ${(alerts.lowWaterMain || alerts.lowWaterDrinker || alerts.lowHydration) ? "bg-destructive/5" : ""
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(alerts.lowWaterMain || alerts.lowWaterDrinker || alerts.lowHydration)
                    ? "bg-destructive/10"
                    : "bg-gradient-water"
                    }`}>
                    <FlaskConical size={20} className={
                      (alerts.lowWaterMain || alerts.lowWaterDrinker || alerts.lowHydration) ? "text-destructive" : "text-white"
                    } />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">Water Levels</h3>
                    <span className="text-xs text-muted-foreground">Main + Drinker</span>
                  </div>
                </div>
                <div className="p-4 pt-3 space-y-3">
                  {/* Main Tank */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Main Tank</span>
                      <span className="text-xs font-semibold text-foreground">
                        {waterLevelMain !== null ? waterLevelMain : "--"}%
                      </span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${waterLevelMain !== null && waterLevelMain < 20 ? "bg-destructive" : "progress-fill-water"}`}
                        style={{ width: `${waterLevelMain !== null ? waterLevelMain : 0}%` }}
                      />
                    </div>
                    {alerts.lowWaterMain && (
                      <p className="mt-1 text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
                        Low water level!
                      </p>
                    )}
                  </div>
                  {/* Drinker */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Drinker</span>
                      <span className="text-xs font-semibold text-foreground">
                        {waterLevelDrinker !== null ? waterLevelDrinker : "--"}%
                      </span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${waterLevelDrinker !== null && waterLevelDrinker < 30 ? "bg-destructive" : "progress-fill-water"}`}
                        style={{ width: `${waterLevelDrinker !== null ? waterLevelDrinker : 0}%` }}
                      />
                    </div>
                    {alerts.lowWaterDrinker && (
                      <p className="mt-1 text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
                        Low drinker water!
                      </p>
                    )}
                    {alerts.lowHydration && (
                      <p className="mt-1 text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
                        Low hydration alert!
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ====== CHARTS & ALERTS ====== */}
          <div className="space-y-6">
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
              <HistoricalChart />
            </div>

            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
              <RecentAlerts />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
