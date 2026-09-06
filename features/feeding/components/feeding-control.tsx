"use client"

import { useState, useEffect } from "react"
import { ref, onValue, set } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { sendFeedCommand, logFeedingEvent } from "@/services/microcontroller/integration"
import { calculateRecommendedGrams, calculateServoOpenTime } from "@/lib/feeding-utils"
import { Utensils, AlertTriangle, CheckCircle2, Info, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { AgeGroupInfo } from "../types"

const AGE_GROUPS: Record<string, AgeGroupInfo> = {
  chick: {
    label: "Starter / Chick",
    ageRange: "1–14 days",
    recommendedGrams: 50,
    description: "Young chicks require starter crumbles with high protein content",
  },
  grower: {
    label: "Grower",
    ageRange: "15–35 days",
    recommendedGrams: 100,
    description: "Growing broilers need grower feed for muscle and bone development",
  },
  adult: {
    label: "Adult / Finisher",
    ageRange: "35+ days",
    recommendedGrams: 150,
    description: "Finisher feed formulated for optimal poultry weight gain",
  },
}

interface FeedingControlProps {
  className?: string
}

export function FeedingControl({ className = "" }: FeedingControlProps) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<"chick" | "grower" | "adult">("adult")
  const [customGrams, setCustomGrams] = useState("")
  const [useCustom, setUseCustom] = useState(false)
  const [isFeeding, setIsFeeding] = useState(false)
  const [feedResult, setFeedResult] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [currentFoodLevel, setCurrentFoodLevel] = useState<number | null>(null)
  const [chickenCount, setChickenCount] = useState(10)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const sensorsRef = ref(firebase.database, "/sensors")
    const unsubSensors = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val()
      if (data && data.foodLevel !== undefined) {
        const val = Number(data.foodLevel)
        setCurrentFoodLevel(isNaN(val) ? null : val)
      }
    })

    const settingsRef = ref(firebase.database, "/feedingSettings")
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        if (data.chickenCount) setChickenCount(Number(data.chickenCount))
        if (data.ageGroup && AGE_GROUPS[data.ageGroup]) {
          setSelectedAgeGroup(data.ageGroup as any)
        }
      }
    })

    return () => {
      unsubSensors()
      unsubSettings()
    }
  }, [])

  const updateChickenCount = (count: number) => {
    if (count < 1 || count > 5000) return
    setChickenCount(count)

    const firebase = initFirebase()
    if (firebase?.database) {
      set(ref(firebase.database, "/feedingSettings/chickenCount"), count).catch((err) =>
        console.error("Error updating chicken count:", err),
      )
    }
  }

  const handleAgeGroupChange = (group: "chick" | "grower" | "adult") => {
    setSelectedAgeGroup(group)

    const firebase = initFirebase()
    if (firebase?.database) {
      set(ref(firebase.database, "/feedingSettings/ageGroup"), group).catch((err) =>
        console.error("Error updating age group:", err),
      )
    }
  }

  const calculatedGrams = calculateRecommendedGrams(selectedAgeGroup, chickenCount)
  const effectiveGrams = useCustom && customGrams ? Number(customGrams) || 0 : calculatedGrams
  const servoDuration = calculateServoOpenTime(effectiveGrams)

  const handleFeed = async () => {
    if (effectiveGrams <= 0) {
      toast.error("Please enter a valid feed amount")
      return
    }

    setIsFeeding(true)
    setFeedResult(null)

    try {
      const success = await sendFeedCommand(servoDuration)
      if (success) {
        await logFeedingEvent(effectiveGrams, selectedAgeGroup, chickenCount, servoDuration)
        setFeedResult({
          type: "success",
          message: `Successfully dispensed ${effectiveGrams}g of feed (${servoDuration.toFixed(1)}s open)`,
        })
        toast.success("Feed Dispensed", {
          description: `Dispensed ${effectiveGrams}g for ${chickenCount} chickens`,
        })
      } else {
        setFeedResult({
          type: "error",
          message: "Failed to communicate with feeder microcontroller",
        })
        toast.error("Feeder Error", {
          description: "Could not trigger servo valve on the controller",
        })
      }
    } catch (err: any) {
      console.error("Dispense error:", err)
      setFeedResult({
        type: "error",
        message: err.message || "An unexpected error occurred",
      })
      toast.error("Dispense Failed")
    } finally {
      setIsFeeding(false)
    }
  }

  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 shadow-sm ${className}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
            <Utensils size={16} />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Automated Feeder Control
            </h2>
            <p className="text-xs text-muted-foreground">
              Direct actuator dispense & flock sizing
            </p>
          </div>
        </div>

        {currentFoodLevel !== null && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              currentFoodLevel < 20
                ? "bg-destructive/10 text-destructive"
                : "bg-surface-muted text-muted-foreground"
            }`}
          >
            Hopper: {currentFoodLevel}%
          </span>
        )}
      </div>

      {/* Age Group Selector Tabs */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Broiler Growth Stage
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["chick", "grower", "adult"] as const).map((group) => {
              const info = AGE_GROUPS[group]
              const isSelected = selectedAgeGroup === group
              return (
                <button
                  key={group}
                  onClick={() => handleAgeGroupChange(group)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? "bg-surface text-foreground border-accent shadow-sm ring-1 ring-accent"
                      : "bg-surface-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  <span className="text-xs font-semibold block">{info.label}</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {info.ageRange}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Flock Chicken Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="flockCount" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Flock Headcount
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateChickenCount(Math.max(1, chickenCount - 5))}
                className="w-10 h-10 rounded-xl bg-surface-muted hover:bg-border text-foreground border border-border flex items-center justify-center font-bold text-sm"
              >
                -
              </button>
              <input
                id="flockCount"
                type="number"
                min="1"
                max="5000"
                value={chickenCount}
                onChange={(e) => updateChickenCount(Number(e.target.value) || 1)}
                className="flex-1 h-10 px-3 text-center text-sm font-semibold rounded-xl bg-surface border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
              />
              <button
                type="button"
                onClick={() => updateChickenCount(chickenCount + 5)}
                className="w-10 h-10 rounded-xl bg-surface-muted hover:bg-border text-foreground border border-border flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Gram calculation display */}
          <div className="p-3.5 rounded-xl bg-surface-muted border border-border flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Recommended Feed Calculation
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-heading text-2xl font-bold text-foreground tabular-nums">
                {effectiveGrams}
              </span>
              <span className="text-xs text-muted-foreground">grams</span>
              <span className="text-[11px] text-muted-foreground ml-auto">
                ~{servoDuration.toFixed(1)}s valve cycle
              </span>
            </div>
          </div>
        </div>

        {/* Manual Gram Override Toggle */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Custom Dispense Quantity</span>
            <button
              type="button"
              onClick={() => setUseCustom(!useCustom)}
              className="text-xs text-accent hover:underline font-medium"
            >
              {useCustom ? "Use Recommended" : "Set Custom Grams"}
            </button>
          </div>

          {useCustom && (
            <div className="flex gap-2">
              <input
                type="number"
                min="10"
                max="10000"
                value={customGrams}
                onChange={(e) => setCustomGrams(e.target.value)}
                placeholder="Enter grams to dispense"
                className="flex-1 h-10 px-3.5 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}
        </div>

        {/* Inline Feedback */}
        {feedResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedResult.type === "success"
                ? "bg-accent/10 text-accent border border-accent/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {feedResult.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{feedResult.message}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleFeed}
          disabled={isFeeding || effectiveGrams <= 0}
          className="w-full h-11 rounded-xl bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isFeeding ? (
            <>
              <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
              <span>Actuating Feeder Valve...</span>
            </>
          ) : (
            <>
              <Utensils size={15} />
              <span>Dispense {effectiveGrams}g Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
