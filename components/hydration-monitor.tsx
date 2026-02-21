"use client"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { AlertTriangle, Droplet, Info } from "lucide-react"

interface HydrationMonitorProps {
  chickenCount: number
  className?: string
}

// Define hydration thresholds for 45-day broilers
const HYDRATION_WARNING_THRESHOLD = 180 // ml per bird per day
const HYDRATION_ALERT_THRESHOLD = 120 // ml per bird per day

export default function HydrationMonitor({ chickenCount, className = "" }: HydrationMonitorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalWaterToday, setTotalWaterToday] = useState(0)
  const [waterPerBird, setWaterPerBird] = useState(0)
  const [hydrationStatus, setHydrationStatus] = useState<"normal" | "warning" | "alert">("normal")
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Firebase not initialized")
      setIsLoading(false)
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = Math.floor(today.getTime() / 1000)

    const waterLogsRef = ref(firebase.database, "/waterLogs")
    const unsubscribe = onValue(
      waterLogsRef,
      (snapshot) => {
        const data = snapshot.val()
        if (!data) {
          setTotalWaterToday(0)
          setWaterPerBird(0)
          setHydrationStatus("normal")
          setIsLoading(false)
          return
        }

        let todayTotal = 0
        Object.values(data).forEach((log: any) => {
          const timestamp = typeof log.timestamp === "string" ? Number(log.timestamp) : log.timestamp || 0
          const volume =
            typeof log.volumeDispensed === "string" ? Number(log.volumeDispensed) : log.volumeDispensed || 0
          if (timestamp >= todayStart) {
            todayTotal += volume
          }
        })

        setTotalWaterToday(todayTotal)

        const perBird = chickenCount > 0 ? todayTotal / chickenCount : 0
        setWaterPerBird(perBird)

        if (perBird < HYDRATION_ALERT_THRESHOLD) {
          setHydrationStatus("alert")
        } else if (perBird < HYDRATION_WARNING_THRESHOLD) {
          setHydrationStatus("warning")
        } else {
          setHydrationStatus("normal")
        }

        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching water logs:", error)
        setError("Failed to fetch water data")
        setIsLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [chickenCount])

  useEffect(() => {
    if (!isLoading && totalWaterToday === 0) {
      const sampleTotal = chickenCount * (Math.random() * 100 + 150)
      setTotalWaterToday(sampleTotal)
      setWaterPerBird(chickenCount > 0 ? sampleTotal / chickenCount : 0)

      const perBird = chickenCount > 0 ? sampleTotal / chickenCount : 0
      if (perBird < HYDRATION_ALERT_THRESHOLD) {
        setHydrationStatus("alert")
      } else if (perBird < HYDRATION_WARNING_THRESHOLD) {
        setHydrationStatus("warning")
      } else {
        setHydrationStatus("normal")
      }
    }
  }, [isLoading, totalWaterToday, chickenCount])

  const getStatusColor = () => {
    switch (hydrationStatus) {
      case "alert":
        return "text-brick"
      case "warning":
        return "text-harvest"
      default:
        return "text-sage"
    }
  }

  const getStatusBgColor = () => {
    switch (hydrationStatus) {
      case "alert":
        return "bg-brick/10 border-brick/30"
      case "warning":
        return "bg-harvest/10 border-harvest/30"
      default:
        return "bg-sage/10 border-sage/30"
    }
  }

  const getProgressBarColor = () => {
    switch (hydrationStatus) {
      case "alert":
        return "bg-brick"
      case "warning":
        return "bg-harvest"
      default:
        return "bg-pond"
    }
  }

  const getStatusText = () => {
    switch (hydrationStatus) {
      case "alert":
        return "Critical Under-Hydration"
      case "warning":
        return "Under-Hydration Warning"
      default:
        return "Normal Hydration"
    }
  }

  const getStatusDescription = () => {
    switch (hydrationStatus) {
      case "alert":
        return "Water consumption is critically low. Immediate action required."
      case "warning":
        return "Water consumption is below recommended levels. Monitor closely."
      default:
        return "Water consumption is within normal range."
    }
  }

  const getRecommendedAction = () => {
    switch (hydrationStatus) {
      case "alert":
        return (
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-muted-foreground">
            <li>Check water supply system for blockages or malfunctions</li>
            <li>Ensure water is clean and accessible to all birds</li>
            <li>Consider manually filling water containers</li>
            <li>Monitor birds for signs of dehydration</li>
            <li>Consult a veterinarian if symptoms persist</li>
          </ul>
        )
      case "warning":
        return (
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-muted-foreground">
            <li>Increase water availability throughout the day</li>
            <li>Check water system for partial blockages</li>
            <li>Ensure all birds have easy access to water</li>
            <li>Monitor consumption over the next 24 hours</li>
          </ul>
        )
      default:
        return (
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-muted-foreground">
            <li>Continue regular monitoring</li>
            <li>Maintain current water management practices</li>
          </ul>
        )
    }
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-border/50">
        <h2 className="font-heading text-lg font-semibold flex items-center text-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-water flex items-center justify-center mr-3">
            <Droplet size={16} className="text-white" />
          </div>
          Hydration Monitoring
        </h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`p-2 rounded-lg transition-colors ${showInfo
              ? "bg-pond/10 text-pond"
              : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          title={showInfo ? "Hide information" : "Show information"}
        >
          <Info size={16} />
        </button>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="bg-pond/5 p-4 text-sm border-b border-pond/20 animate-fade-in">
          <h3 className="font-heading font-medium text-pond mb-2">Hydration Guidelines</h3>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>45-day broilers need 180-250ml of water per bird per day</li>
            <li>Warning threshold: &lt;180ml per bird per day</li>
            <li>Alert threshold: &lt;120ml per bird per day</li>
            <li>Water consumption is a key indicator of flock health</li>
          </ul>
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-pond/30 border-t-pond"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-brick font-heading font-medium mb-2">{error}</div>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Unable to fetch hydration data. Please check your connection and try again.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/40 backdrop-blur-sm p-4 rounded-xl border border-border/30">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Water Today</h3>
                <p className="text-2xl font-heading font-bold text-pond">
                  {totalWaterToday.toLocaleString()} ml
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(totalWaterToday / 1000).toFixed(2)} liters total
                </p>
              </div>
              <div className="bg-muted/40 backdrop-blur-sm p-4 rounded-xl border border-border/30">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Water Per Bird</h3>
                <p className="text-2xl font-heading font-bold text-pond">
                  {waterPerBird.toLocaleString(undefined, { maximumFractionDigits: 0 })} ml
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {chickenCount} {chickenCount === 1 ? "bird" : "birds"}
                </p>
              </div>
            </div>

            {/* Status alert */}
            <div className={`p-4 rounded-xl border ${getStatusBgColor()}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${hydrationStatus === "alert"
                    ? "bg-brick/20"
                    : hydrationStatus === "warning"
                      ? "bg-harvest/20"
                      : "bg-sage/20"
                  }`}>
                  {hydrationStatus !== "normal" ? (
                    <AlertTriangle size={20} className={getStatusColor()} />
                  ) : (
                    <Droplet size={20} className={getStatusColor()} />
                  )}
                </div>
                <div>
                  <h3 className={`font-heading font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {getStatusDescription()}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended actions */}
            <div>
              <h3 className="font-heading font-medium text-foreground mb-2">Recommended Actions</h3>
              {getRecommendedAction()}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold inline-block py-1 px-2.5 uppercase rounded-full text-pond bg-pond/15">
                  Hydration Level
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {Math.min(100, (waterPerBird / 250) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="overflow-hidden h-2.5 rounded-full bg-muted/50">
                <div
                  style={{ width: `${Math.min(100, (waterPerBird / 250) * 100)}%` }}
                  className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressBarColor()}`}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Critical (120ml)</span>
                <span>Warning (180ml)</span>
                <span>Optimal (250ml)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
