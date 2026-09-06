"use client"

import { WaterSchedule, WaterSettings } from "../types"
import { Clock, Droplets, Settings, Info, Play, Square } from "lucide-react"

interface WaterScheduleFormProps {
  schedule: WaterSchedule
  settings: WaterSettings
  isManualFilling: boolean
  onToggleHour: (hour: number) => Promise<void>
  onUpdateFillDuration: (duration: number) => Promise<void>
  onUpdateFlowRate: (rate: number) => Promise<void>
  onToggleAutoWater: () => Promise<void>
  onTriggerManualFill: () => Promise<void>
  className?: string
}

export function WaterScheduleForm({
  schedule,
  settings,
  isManualFilling,
  onToggleHour,
  onUpdateFillDuration,
  onUpdateFlowRate,
  onToggleAutoWater,
  onTriggerManualFill,
  className = "",
}: WaterScheduleFormProps) {
  const activeHours = Object.entries(schedule).filter(([_, active]) => active).map(([h]) => Number(h))
  const estimatedVolume = (settings.fillDuration * settings.flowRate) / 1000

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Schedule Grid Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-foreground">
                  Water Filling Schedule
                </h2>
                <p className="text-xs text-muted-foreground">
                  Automated refill intervals (24-hour cycle)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto Watering:</span>
              <button
                type="button"
                onClick={onToggleAutoWater}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  settings.autoEnabled
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-surface-muted text-muted-foreground border border-border"
                }`}
              >
                {settings.autoEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            Click hour slot to toggle scheduled reservoir filling:
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
            {Array.from({ length: 24 }).map((_, hour) => {
              const key = hour.toString()
              const isActive = !!schedule[key]
              return (
                <button
                  key={hour}
                  disabled={!settings.autoEnabled}
                  onClick={() => onToggleHour(hour)}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all text-xs border ${
                    isActive
                      ? "bg-accent text-accent-foreground border-accent font-semibold shadow-sm"
                      : "bg-surface-muted text-muted-foreground border-border hover:text-foreground"
                  } ${!settings.autoEnabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span className="tabular-nums font-bold text-xs">
                    {hour.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[10px] opacity-80">:00</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Manual Dispense Trigger */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={onTriggerManualFill}
            disabled={isManualFilling}
            className="w-full h-11 rounded-xl bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isManualFilling ? (
              <>
                <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                <span>Pumping Water ({settings.fillDuration}s)...</span>
              </>
            ) : (
              <>
                <Droplets size={15} />
                <span>Fill Water Reservoir Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings & Calibration Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
              <Settings size={16} />
            </div>
            <div>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Pump Parameters & Calibration
              </h2>
              <p className="text-xs text-muted-foreground">
                Solenoid open duration & flow calibration
              </p>
            </div>
          </div>

          {/* Fill Duration Slider */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs">
              <label htmlFor="fillDurationSlider" className="font-medium text-foreground">
                Fill Duration Cycle
              </label>
              <span className="font-semibold text-foreground tabular-nums">
                {settings.fillDuration} seconds
              </span>
            </div>
            <input
              id="fillDurationSlider"
              type="range"
              min="5"
              max="120"
              step="5"
              value={settings.fillDuration}
              onChange={(e) => onUpdateFillDuration(Number(e.target.value))}
              className="w-full accent-accent h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>5s</span>
              <span>Est. volume: ~{estimatedVolume.toFixed(2)} Liters</span>
              <span>120s</span>
            </div>
          </div>

          {/* Flow Rate Calibration Input */}
          <div className="space-y-2 mb-6">
            <label htmlFor="flowRateInput" className="block text-xs font-medium text-foreground">
              Calibrated Flow Rate (ml / second)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="flowRateInput"
                type="number"
                min="10"
                max="1000"
                value={settings.flowRate}
                onChange={(e) => onUpdateFlowRate(Number(e.target.value) || 10)}
                className="flex-1 h-10 px-3.5 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
              />
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                ml/sec
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Measure actual fluid discharge per second from your pump to keep volume analytics accurate.
            </p>
          </div>
        </div>

        {/* Guidance Note */}
        <div className="p-4 rounded-xl bg-surface-muted border border-border text-xs text-muted-foreground flex items-start gap-2.5">
          <Info size={15} className="flex-shrink-0 text-muted-foreground mt-0.5" />
          <span>
            Clean water pipes and bell drinkers regularly to prevent biofilm buildup and ensure
            consistent flow rate delivery.
          </span>
        </div>
      </div>
    </div>
  )
}
