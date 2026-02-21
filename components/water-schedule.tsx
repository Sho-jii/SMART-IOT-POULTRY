"use client"

import { useState, useEffect } from "react"
import { ref, onValue, set } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Clock, Calendar, Settings, Save, RefreshCw, Info } from "lucide-react"
import { toast } from "sonner"

interface WaterScheduleProps {
  className?: string
}

export default function WaterSchedule({ className = "" }: WaterScheduleProps) {
  const [schedule, setSchedule] = useState<{ [hour: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)
  const [waterSettings, setWaterSettings] = useState({
    flowRate: 100, // ml per second
    fillDuration: 30, // seconds
    autoEnabled: true,
  })

  // Load schedule from Firebase
  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    // Get water schedule from Firebase
    const scheduleRef = ref(firebase.database, "/waterSchedule")
    const unsubscribeSchedule = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val() || {}

      // Convert to our format with hour keys
      const formattedSchedule: { [hour: string]: boolean } = {}
      for (let i = 0; i < 24; i++) {
        const hourKey = i.toString()
        formattedSchedule[hourKey] = !!data[hourKey]
      }

      setSchedule(formattedSchedule)
      setIsLoading(false)
    })

    // Get water settings from Firebase
    const settingsRef = ref(firebase.database, "/waterSettings")
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val() || {}
      setWaterSettings({
        flowRate: data.flowRate || 100,
        fillDuration: data.fillDuration || 30,
        autoEnabled: data.autoEnabled !== undefined ? data.autoEnabled : true,
      })
    })

    return () => {
      unsubscribeSchedule()
      unsubscribeSettings()
    }
  }, [])

  // Toggle hour in schedule
  const toggleHour = (hour: string) => {
    setSchedule((prev) => ({
      ...prev,
      [hour]: !prev[hour],
    }))
  }

  // Save schedule to Firebase
  const saveSchedule = async () => {
    setIsSaving(true)
    setSaveSuccess(null)

    try {
      const firebase = initFirebase()
      if (!firebase?.database) throw new Error("Firebase not initialized")

      // Save schedule
      await set(ref(firebase.database, "/waterSchedule"), schedule)

      // Save settings
      await set(ref(firebase.database, "/waterSettings"), waterSettings)

      setSaveSuccess(true)
      toast.success("Schedule Saved", {
        description: "Water filling schedule and settings saved successfully",
      })
      setTimeout(() => setSaveSuccess(null), 3000)
    } catch (error) {
      console.error("Error saving water schedule:", error)
      setSaveSuccess(false)
      toast.error("Save Failed", {
        description: "Failed to save water schedule. Please try again.",
      })
      setTimeout(() => setSaveSuccess(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle settings change
  const handleSettingChange = (setting: keyof typeof waterSettings, value: any) => {
    setWaterSettings((prev) => ({
      ...prev,
      [setting]: setting === "autoEnabled" ? value : Number(value),
    }))
  }

  // Calculate water volume based on flow rate and duration
  const calculatedVolume = waterSettings.flowRate * waterSettings.fillDuration

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-border/50">
        <h2 className="font-heading text-lg font-semibold flex items-center text-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-water flex items-center justify-center mr-3">
            <Calendar size={16} className="text-white" />
          </div>
          Water Filling Schedule
        </h2>
        <button
          onClick={saveSchedule}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-pond text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Save Schedule
        </button>
      </div>

      {/* Save feedback */}
      {saveSuccess === true && (
        <div className="bg-sage/10 text-sage text-sm p-2.5 text-center border-b border-sage/20 animate-fade-in">
          Schedule saved successfully!
        </div>
      )}

      {saveSuccess === false && (
        <div className="bg-brick/10 text-brick text-sm p-2.5 text-center border-b border-brick/20 animate-fade-in">
          Failed to save schedule. Please try again.
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-pond/30 border-t-pond"></div>
          </div>
        ) : (
          <>
            {/* Water Settings */}
            <div className="mb-6">
              <h3 className="text-sm font-heading font-medium text-foreground mb-3 flex items-center">
                <Settings className="mr-1.5 h-4 w-4 text-muted-foreground" /> Water Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Flow Rate (ml/second)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={waterSettings.flowRate}
                    onChange={(e) => handleSettingChange("flowRate", e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/40 border border-border/40 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pond/40 focus:border-pond/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fill Duration (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={waterSettings.fillDuration}
                    onChange={(e) => handleSettingChange("fillDuration", e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/40 border border-border/40 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pond/40 focus:border-pond/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Calculated Volume</label>
                  <div className="w-full px-3 py-2.5 bg-muted/30 border border-border/30 rounded-xl text-sm text-foreground">
                    {calculatedVolume} ml ({(calculatedVolume / 1000).toFixed(2)} L)
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={waterSettings.autoEnabled}
                      onChange={(e) => handleSettingChange("autoEnabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:bg-pond peer-focus:ring-2 peer-focus:ring-pond/40 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </div>
                  <span className="ml-3 text-sm text-foreground">
                    Enable automatic water filling schedule
                  </span>
                </label>
              </div>
            </div>

            {/* Hour selector */}
            <h3 className="text-sm font-heading font-medium text-foreground mb-3 flex items-center">
              <Clock className="mr-1.5 h-4 w-4 text-muted-foreground" /> Select Hours for Water Filling
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {Array.from({ length: 24 }).map((_, i) => {
                const hour = i.toString()
                const isActive = schedule[hour]
                const displayHour = i === 0 ? "12 AM" : i === 12 ? "12 PM" : i < 12 ? `${i} AM` : `${i - 12} PM`

                return (
                  <button
                    key={hour}
                    onClick={() => toggleHour(hour)}
                    className={`p-2 rounded-lg text-center text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-pond text-white shadow-sm border-2 border-pond"
                      : "bg-muted/50 text-muted-foreground border-2 border-transparent hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    {displayHour}
                  </button>
                )
              })}
            </div>

            {/* How it works */}
            <div className="mt-6 bg-pond/5 border border-pond/15 p-4 rounded-xl">
              <h4 className="text-sm font-heading font-medium text-pond mb-1 flex items-center gap-1.5">
                <Info size={14} />
                How it works
              </h4>
              <p className="text-xs text-muted-foreground">
                Select the hours when you want the system to automatically fill water. The system will dispense{" "}
                <span className="font-medium text-foreground">{calculatedVolume} ml</span> of water at the beginning of each selected
                hour. Make sure to adjust the flow rate and fill duration based on your pump&apos;s actual performance.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
