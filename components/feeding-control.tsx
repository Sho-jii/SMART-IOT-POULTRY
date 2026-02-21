"use client"

import { useState, useEffect } from "react"
import { ref, set, get, onValue } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Utensils, AlertTriangle, CheckCircle, Info, ChevronDown, Egg } from "lucide-react"
import { toast } from "sonner"

interface FeedingControlProps {
  className?: string
}

interface AgeGroupInfo {
  label: string
  ageRange: string
  recommendedGrams: number
  description: string
}

const AGE_GROUPS: { [key: string]: AgeGroupInfo } = {
  starter: {
    label: "Starter",
    ageRange: "1-14 days",
    recommendedGrams: 25,
    description: "Young chicks require starter feed with high protein content",
  },
  grower: {
    label: "Grower",
    ageRange: "15-35 days",
    recommendedGrams: 80,
    description: "Growing birds need grower feed for muscle development",
  },
  adult: {
    label: "Adult",
    ageRange: "35+ days",
    recommendedGrams: 150,
    description: "Adult broilers need finisher feed for weight gain",
  },
}

export default function FeedingControl({ className = "" }: FeedingControlProps) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("adult")
  const [customGrams, setCustomGrams] = useState("")
  const [useCustom, setUseCustom] = useState(false)
  const [isFeeding, setIsFeeding] = useState(false)
  const [feedResult, setFeedResult] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [currentFoodLevel, setCurrentFoodLevel] = useState<number | null>(null)
  const [chickenCount, setChickenCount] = useState(0)
  const [showAgeDropdown, setShowAgeDropdown] = useState(false)

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    const sensorRef = ref(firebase.database, "/sensorData")
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setCurrentFoodLevel(data.foodLevel !== undefined ? data.foodLevel : null)
      }
    })

    const settingsRef = ref(firebase.database, "/settings")
    const unsub2 = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val()
      if (data?.chickenCount) {
        setChickenCount(data.chickenCount)
      }
    })

    return () => {
      unsubscribe()
      unsub2()
    }
  }, [])

  const updateChickenCount = (count: number) => {
    if (count < 1 || count > 10000) return
    setChickenCount(count)
    const firebase = initFirebase()
    if (!firebase?.database) return
    set(ref(firebase.database, "/settings/chickenCount"), count).catch((err) =>
      console.error("Error updating chicken count:", err)
    )
  }

  const getGramsToDispense = (): number => {
    if (useCustom && customGrams) {
      return Number(customGrams)
    }
    return AGE_GROUPS[selectedAgeGroup].recommendedGrams * Math.max(1, chickenCount)
  }

  const resetFeedControl = () => {
    setIsFeeding(false)
    setTimeout(() => setFeedResult(null), 5000)
  }

  const handleFeed = async () => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setFeedResult({ type: "error", message: "Firebase not initialized" })
      return
    }

    const grams = getGramsToDispense()
    if (grams <= 0) {
      setFeedResult({ type: "error", message: "Invalid amount. Please enter a positive number." })
      return
    }

    setIsFeeding(true)
    setFeedResult(null)

    try {
      const feedCommandRef = ref(firebase.database, "/feedControl")
      await set(feedCommandRef, {
        command: "dispense",
        gramsRequested: grams,
        ageGroup: selectedAgeGroup,
        timestamp: Math.floor(Date.now() / 1000),
        status: "pending",
      })

      const logRef = ref(firebase.database, `/feedingLogs/${Date.now()}`)
      await set(logRef, {
        timestamp: Math.floor(Date.now() / 1000),
        gramsDispensed: grams,
        ageGroup: selectedAgeGroup,
        chickenCount: chickenCount,
        source: "manual",
      })

      setFeedResult({
        type: "success",
        message: `Successfully dispensed ${grams}g of feed for ${chickenCount} ${AGE_GROUPS[selectedAgeGroup].label.toLowerCase()} birds.`,
      })
      toast.success("Feed Dispensed", {
        description: `${grams}g dispensed for ${chickenCount} ${AGE_GROUPS[selectedAgeGroup].label.toLowerCase()} birds`,
      })
      resetFeedControl()
    } catch (err: any) {
      console.error("Error dispensing feed:", err)
      setFeedResult({ type: "error", message: `Failed to dispense: ${err.message}` })
      toast.error("Feed Dispense Failed", {
        description: err.message,
      })
      resetFeedControl()
    }
  }

  const ageGroupInfo = AGE_GROUPS[selectedAgeGroup]

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-border/50">
        <h2 className="font-heading text-lg font-semibold flex items-center text-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-sage flex items-center justify-center mr-3">
            <Utensils size={16} className="text-white" />
          </div>
          Feeding Control
        </h2>
        {currentFoodLevel !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Food Level:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${currentFoodLevel > 60
                    ? "bg-sage"
                    : currentFoodLevel > 30
                      ? "bg-harvest"
                      : "bg-brick"
                    }`}
                  style={{ width: `${Math.min(100, currentFoodLevel)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">{currentFoodLevel}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Age group selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Bird Age Group</label>
          <div className="relative">
            <button
              onClick={() => setShowAgeDropdown(!showAgeDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 border border-border/40 text-foreground hover:bg-muted/60 transition-colors text-left"
            >
              <div>
                <span className="font-medium">{ageGroupInfo.label}</span>
                <span className="text-muted-foreground text-sm ml-2">({ageGroupInfo.ageRange})</span>
              </div>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showAgeDropdown ? "rotate-180" : ""}`} />
            </button>
            {showAgeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-card-elevated z-20 py-1 animate-fade-in">
                {Object.entries(AGE_GROUPS).map(([key, group]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedAgeGroup(key)
                      setShowAgeDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedAgeGroup === key
                      ? "bg-sage/10 text-sage font-medium"
                      : "text-foreground hover:bg-muted/60"
                      }`}
                  >
                    <span className="font-medium">{group.label}</span>
                    <span className="text-muted-foreground ml-2">({group.ageRange})</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chicken count */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Number of Birds</label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-harvest/15 flex items-center justify-center flex-shrink-0">
                <Egg size={16} className="text-harvest" />
              </div>
              <input
                type="number"
                value={chickenCount || ""}
                onChange={(e) => updateChickenCount(Number(e.target.value))}
                placeholder="Enter bird count"
                className="flex-1 bg-muted/40 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-harvest/40 focus:border-harvest/50 transition-all"
                min="1"
                max="10000"
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">birds</span>
          </div>
        </div>

        {/* Feed amount */}
        <div className="bg-muted/30 p-4 rounded-xl border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-sage" />
            <h3 className="text-sm font-heading font-medium text-foreground">Feed Amount</h3>
          </div>

          {/* Recommended amount */}
          <div className={`p-3 rounded-lg border transition-colors cursor-pointer mb-3 ${!useCustom
            ? "bg-sage/10 border-sage/30 text-sage"
            : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
            }`}
            onClick={() => setUseCustom(false)}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Recommended:</span>
                <span className="ml-2 text-lg font-heading font-bold">
                  {ageGroupInfo.recommendedGrams * Math.max(1, chickenCount)}g
                </span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!useCustom ? "border-sage" : "border-muted-foreground"
                }`}>
                {!useCustom && <div className="w-2 h-2 rounded-full bg-sage" />}
              </div>
            </div>
            <p className="text-xs mt-1 opacity-70">
              {ageGroupInfo.recommendedGrams}g × {Math.max(1, chickenCount)} birds
            </p>
          </div>

          {/* Custom amount */}
          <div className={`p-3 rounded-lg border transition-colors cursor-pointer ${useCustom
            ? "bg-harvest/10 border-harvest/30 text-harvest"
            : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
            }`}
            onClick={() => setUseCustom(true)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Custom Amount:</span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${useCustom ? "border-harvest" : "border-muted-foreground"
                }`}>
                {useCustom && <div className="w-2 h-2 rounded-full bg-harvest" />}
              </div>
            </div>
            {useCustom && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customGrams}
                  onChange={(e) => setCustomGrams(e.target.value)}
                  placeholder="Enter grams"
                  className="flex-1 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-harvest/40 focus:border-harvest/50"
                  min="1"
                  max="5000"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm font-medium">grams</span>
              </div>
            )}
          </div>
        </div>

        {/* Feed button */}
        <button
          onClick={handleFeed}
          disabled={isFeeding || (useCustom && (!customGrams || Number(customGrams) <= 0))}
          className="w-full py-3.5 rounded-xl font-heading font-semibold text-white bg-gradient-sage hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isFeeding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              Dispensing...
            </>
          ) : (
            <>
              <Utensils size={18} />
              Dispense {getGramsToDispense()}g of Feed
            </>
          )}
        </button>

        {/* Result message */}
        {feedResult && (
          <div className={`p-3 rounded-xl flex items-start gap-2.5 animate-fade-in ${feedResult.type === "success"
            ? "bg-sage/10 border border-sage/30"
            : "bg-brick/10 border border-brick/30"
            }`}>
            {feedResult.type === "success" ? (
              <CheckCircle size={18} className="text-sage flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={18} className="text-brick flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${feedResult.type === "success" ? "text-sage" : "text-brick"
              }`}>
              {feedResult.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
