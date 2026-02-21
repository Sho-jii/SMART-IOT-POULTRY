"use client"

import { useEffect, useState } from "react"
import { ref, onValue, set } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import LoadingAnimation from "@/components/loading-animation"
import NavigationMenu from "@/components/navigation-menu"
import { Clock, Droplet, Info, Settings } from "lucide-react"

export default function WaterSchedulePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [waterSchedule, setWaterSchedule] = useState<{ [key: string]: boolean }>({})
  const [waterFillDuration, setWaterFillDuration] = useState(30)
  const [waterFlowRate, setWaterFlowRate] = useState(100)
  const [autoWaterEnabled, setAutoWaterEnabled] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return

    const firebase = initFirebase()
    if (!firebase?.database) return

    const scheduleRef = ref(firebase.database, "/waterSchedule")
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const schedule = snapshot.val()
      if (schedule) {
        const processedSchedule: { [key: string]: boolean } = {}
        Object.keys(schedule).forEach((key) => {
          const value = schedule[key]
          processedSchedule[key] = value === true || value === "true" || value === 1 || value === "1"
        })
        setWaterSchedule(processedSchedule)
      } else {
        setWaterSchedule({})
      }
    })

    const settingsRef = ref(firebase.database, "/waterSettings")
    const settingsUnsubscribe = onValue(settingsRef, (snapshot) => {
      const settings = snapshot.val()
      if (settings) {
        if (settings.fillDuration !== undefined) setWaterFillDuration(settings.fillDuration)
        if (settings.flowRate !== undefined) setWaterFlowRate(settings.flowRate)
        if (settings.autoEnabled !== undefined) {
          setAutoWaterEnabled(
            settings.autoEnabled === true || settings.autoEnabled === "true" || settings.autoEnabled === 1 || settings.autoEnabled === "1"
          )
        }
      }
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
      settingsUnsubscribe()
    }
  }, [isAuthenticated, authLoading])

  const toggleWaterHour = (hour: number) => {
    const firebase = initFirebase()
    if (!firebase?.database) return
    try {
      const newSchedule = { ...waterSchedule }
      newSchedule[hour] = !newSchedule[hour]
      setWaterSchedule(newSchedule)
      set(ref(firebase.database, `/waterSchedule/${hour}`), newSchedule[hour])
        .catch((err) => console.error("Error updating water schedule:", err))
    } catch (err: any) {
      console.error("Error toggling water hour:", err)
    }
  }

  const updateWaterFillDuration = (duration: number) => {
    const firebase = initFirebase()
    if (!firebase?.database) return
    try {
      setWaterFillDuration(duration)
      set(ref(firebase.database, "/waterSettings/fillDuration"), duration)
        .catch((err) => console.error("Error updating water fill duration:", err))
    } catch (err: any) {
      console.error("Error updating water fill duration:", err)
    }
  }

  const updateWaterFlowRate = (rate: number) => {
    const firebase = initFirebase()
    if (!firebase?.database) return
    try {
      setWaterFlowRate(rate)
      set(ref(firebase.database, "/waterSettings/flowRate"), rate)
        .catch((err) => console.error("Error updating water flow rate:", err))
    } catch (err: any) {
      console.error("Error updating water flow rate:", err)
    }
  }

  const toggleAutoWater = () => {
    const firebase = initFirebase()
    if (!firebase?.database) return
    try {
      const newState = !autoWaterEnabled
      setAutoWaterEnabled(newState)
      set(ref(firebase.database, "/waterSettings/autoEnabled"), newState)
        .catch((err) => console.error("Error updating auto water state:", err))
    } catch (err: any) {
      console.error("Error toggling auto water:", err)
    }
  }

  const triggerManualWaterFill = () => {
    const firebase = initFirebase()
    if (!firebase?.database) return
    try {
      set(ref(firebase.database, "/controls/waterFill"), true)
        .then(() => {
          setTimeout(() => {
            set(ref(firebase.database, "/controls/waterFill"), false).catch((err) =>
              console.error("Error resetting water fill command:", err)
            )
          }, 2000)
        })
        .catch((err) => console.error("Error triggering manual water fill:", err))
    } catch (err: any) {
      console.error("Error triggering manual water fill:", err)
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
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Water Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">Set automatic water filling times and manage water settings</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule Card */}
            <div className="sensor-card overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
              <div className="flex items-center gap-3 p-4 pb-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-water flex items-center justify-center">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-foreground">Water Filling Schedule</h2>
                  <span className="text-xs text-muted-foreground">24-hour format</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-muted-foreground">Set automatic filling times:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Auto Schedule</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={autoWaterEnabled}
                        onChange={toggleAutoWater}
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <button
                      key={hour}
                      className={`w-full h-12 rounded-lg text-xs font-medium transition-all duration-200 ${waterSchedule[hour]
                        ? "bg-pond text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        } ${!autoWaterEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => toggleWaterHour(hour)}
                      disabled={!autoWaterEnabled}
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <button
                    onClick={triggerManualWaterFill}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-water text-white font-heading font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-pond/20"
                  >
                    <Droplet size={18} />
                    Fill Water Now
                  </button>
                </div>
              </div>
            </div>

            {/* Settings Card */}
            <div className="sensor-card overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
              <div className="flex items-center gap-3 p-4 pb-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-water flex items-center justify-center">
                  <Settings size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-foreground">Water Settings</h2>
                  <span className="text-xs text-muted-foreground">Calibration & parameters</span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label htmlFor="fillDuration" className="block text-xs font-medium text-muted-foreground mb-2">
                    Fill Duration (seconds)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      id="fillDuration"
                      min="5"
                      max="120"
                      step="5"
                      value={waterFillDuration}
                      onChange={(e) => updateWaterFillDuration(Number.parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <span className="ml-4 w-12 text-center font-heading font-semibold text-sm text-foreground">{waterFillDuration}s</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estimated volume: {(waterFillDuration * waterFlowRate).toLocaleString()}ml (
                    {((waterFillDuration * waterFlowRate) / 1000).toFixed(1)}L)
                  </p>
                </div>

                <div className="mb-6">
                  <label htmlFor="flowRate" className="block text-xs font-medium text-muted-foreground mb-2">
                    Flow Rate Calibration (ml/second)
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      id="flowRate"
                      min="10"
                      max="500"
                      value={waterFlowRate}
                      onChange={(e) => updateWaterFlowRate(Number.parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    <span className="ml-3 flex items-center text-xs font-medium text-muted-foreground whitespace-nowrap">ml/s</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Calibrate based on your pump&apos;s actual flow rate
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h3 className="font-heading text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <Info size={14} />
                    Water Management Tips
                  </h3>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                    <li>Broiler chickens (45 days) need 180-250ml of water per day</li>
                    <li>Water should be available throughout the day</li>
                    <li>Clean water containers regularly to prevent bacterial growth</li>
                    <li>Monitor water consumption to detect health issues early</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
