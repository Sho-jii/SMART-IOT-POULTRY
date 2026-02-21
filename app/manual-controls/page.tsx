"use client"

import { useEffect, useState } from "react"
import { ref, onValue, set } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import LoadingAnimation from "@/components/loading-animation"
import NavigationMenu from "@/components/navigation-menu"
import { Fan, Lightbulb, Droplet, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function ManualControls() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [firebase, setFirebase] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [fanState, setFanState] = useState(false)
  const [heatState, setHeatState] = useState(false)
  const [pumpState, setPumpState] = useState(false)
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return

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
      setTimeout(() => setIsLoading(false), 1000)
    }
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    if (!firebase?.database) return
    try {
      const deviceStatesRef = ref(firebase.database, "/deviceStates")
      const unsubscribe = onValue(deviceStatesRef, (snapshot) => {
        const data = snapshot.val()
        if (!data) return
        if (data.fan !== undefined) {
          setFanState(!(data.fan === true || data.fan === "true" || data.fan === 1 || data.fan === "1"))
        }
        if (data.heat !== undefined) {
          setHeatState(!(data.heat === true || data.heat === "true" || data.heat === 1 || data.heat === "1"))
        }
        if (data.pump !== undefined) {
          setPumpState(!(data.pump === true || data.pump === "true" || data.pump === 1 || data.pump === "1"))
        }
        setLastDataRefresh(new Date())
      }, (error) => console.error("Firebase device states error:", error))
      return () => unsubscribe()
    } catch (err: any) {
      console.error("Error setting up device states listener:", err)
    }
  }, [firebase])

  useEffect(() => {
    if (!firebase?.database) return
    try {
      const automationRef = ref(firebase.database, "/controls/automationEnabled")
      const unsubscribe = onValue(automationRef, (snapshot) => {
        const enabled = snapshot.val()
        setAutomationEnabled(enabled === true || enabled === "true" || enabled === 1 || enabled === "1")
      }, (error) => console.error("Firebase automation state error:", error))
      return () => unsubscribe()
    } catch (err: any) {
      console.error("Error setting up automation state listener:", err)
    }
  }, [firebase])

  const toggleAutomation = () => {
    if (!firebase?.database) return
    try {
      const newState = !automationEnabled
      setAutomationEnabled(newState)
      set(ref(firebase.database, "/controls/automationEnabled"), newState)
        .then(() => toast.info(newState ? "Automation Enabled" : "Automation Disabled", {
          description: newState ? "System will control devices automatically" : "Manual control mode active",
        }))
        .catch((err) => {
          console.error("Error updating automation state:", err)
          toast.error("Failed to toggle automation")
        })
    } catch (err: any) {
      console.error("Error toggling automation:", err)
    }
  }

  const toggleFan = () => {
    if (!firebase?.database) return
    try {
      const newState = !fanState
      setFanState(newState)
      set(ref(firebase.database, "/controls/fan"), newState)
        .then(() => toast.success(newState ? "Fan Turned On" : "Fan Turned Off"))
        .catch((err) => {
          console.error("Error updating fan state:", err)
          toast.error("Failed to toggle fan")
        })
    } catch (err: any) {
      console.error("Error toggling fan:", err)
    }
  }

  const toggleHeat = () => {
    if (!firebase?.database) return
    try {
      const newState = !heatState
      setHeatState(newState)
      set(ref(firebase.database, "/controls/heat"), newState)
        .then(() => toast.success(newState ? "Heater Turned On" : "Heater Turned Off"))
        .catch((err) => {
          console.error("Error updating heat state:", err)
          toast.error("Failed to toggle heater")
        })
    } catch (err: any) {
      console.error("Error toggling heat:", err)
    }
  }

  const togglePump = () => {
    if (!firebase?.database) return
    try {
      const newState = !pumpState
      setPumpState(newState)
      set(ref(firebase.database, "/controls/pump"), newState)
        .then(() => toast.success(newState ? "Water Pump Turned On" : "Water Pump Turned Off"))
        .catch((err) => {
          console.error("Error updating pump state:", err)
          toast.error("Failed to toggle pump")
        })
    } catch (err: any) {
      console.error("Error toggling pump:", err)
    }
  }

  const refreshData = () => {
    if (!firebase?.database) return
    try {
      const deviceStatesRef = ref(firebase.database, "/deviceStates")
      onValue(deviceStatesRef, (snapshot) => {
        const data = snapshot.val()
        if (!data) return
        if (data.fan !== undefined) setFanState(!(data.fan === true || data.fan === "true" || data.fan === 1 || data.fan === "1"))
        if (data.heat !== undefined) setHeatState(!(data.heat === true || data.heat === "true" || data.heat === 1 || data.heat === "1"))
        if (data.pump !== undefined) setPumpState(!(data.pump === true || data.pump === "true" || data.pump === 1 || data.pump === "1"))
        setLastDataRefresh(new Date())
      }, { onlyOnce: true })

      const automationRef = ref(firebase.database, "/controls/automationEnabled")
      onValue(automationRef, (snapshot) => {
        const enabled = snapshot.val()
        setAutomationEnabled(enabled === true || enabled === "true" || enabled === 1 || enabled === "1")
      }, { onlyOnce: true })
    } catch (err: any) {
      console.error("Error refreshing data:", err)
    }
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

  const controls = [
    {
      name: "Fan Control",
      icon: Fan,
      state: fanState,
      toggle: toggleFan,
      gradient: "bg-gradient-sage",
      onColor: "text-sage dark:text-sage-light",
      bgActive: "bg-sage/10",
      spinning: true,
    },
    {
      name: "Heat Lamp",
      icon: Lightbulb,
      state: heatState,
      toggle: toggleHeat,
      gradient: "bg-gradient-warm",
      onColor: "text-copper dark:text-copper-light",
      bgActive: "bg-copper/10",
      spinning: false,
    },
    {
      name: "Water Pump",
      icon: Droplet,
      state: pumpState,
      toggle: togglePump,
      gradient: "bg-gradient-water",
      onColor: "text-pond dark:text-pond-light",
      bgActive: "bg-pond/10",
      spinning: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-300">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in-up">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Manual Controls</h1>
              <p className="text-sm text-muted-foreground mt-1">Direct control over farm devices</p>
              {lastDataRefresh && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {lastDataRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium text-sm transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Automation</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={automationEnabled} onChange={toggleAutomation} />
                  <div className="w-10 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {controls.map((ctrl, index) => {
              const Icon = ctrl.icon
              return (
                <div
                  key={ctrl.name}
                  className="sensor-card overflow-hidden opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-3 p-4 pb-3 border-b border-border/50">
                    <div className={`w-10 h-10 rounded-xl ${ctrl.gradient} flex items-center justify-center`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <h2 className="font-heading text-sm font-semibold text-foreground">{ctrl.name}</h2>
                  </div>
                  <div className="p-6 flex flex-col items-center">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${ctrl.state ? ctrl.bgActive : "bg-muted/50"
                      }`}>
                      <Icon
                        size={56}
                        className={`transition-colors duration-300 ${ctrl.state ? ctrl.onColor : "text-muted-foreground/40"} ${ctrl.state && ctrl.spinning ? "animate-spin" : ""
                          }`}
                        style={ctrl.state && ctrl.spinning ? { animationDuration: "3s" } : undefined}
                      />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-4">
                      Status:{" "}
                      <span className={ctrl.state ? ctrl.onColor : "text-destructive"}>
                        {ctrl.state ? "ON" : "OFF"}
                      </span>
                    </p>
                    <button
                      onClick={ctrl.toggle}
                      disabled={automationEnabled}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${automationEnabled
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : ctrl.state
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                    >
                      {ctrl.state ? "Turn OFF" : "Turn ON"}
                    </button>
                    {automationEnabled && (
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Disable automation to manually control
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
