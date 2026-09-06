"use client"

import { DeviceStates } from "../types"
import { Fan, Lightbulb, Droplets, Bot, ShieldAlert, Zap, RefreshCw } from "lucide-react"

interface ManualControlsPanelProps {
  deviceStates: DeviceStates
  automationEnabled: boolean
  lastDataRefresh: Date | null
  onToggleFan: () => Promise<void>
  onToggleHeat: () => Promise<void>
  onTogglePump: () => Promise<void>
  onToggleAutomation: () => Promise<void>
  onRefresh: () => Promise<void>
  className?: string
}

export function ManualControlsPanel({
  deviceStates,
  automationEnabled,
  lastDataRefresh,
  onToggleFan,
  onToggleHeat,
  onTogglePump,
  onToggleAutomation,
  onRefresh,
  className = "",
}: ManualControlsPanelProps) {
  const actuators = [
    {
      id: "fan",
      name: "Exhaust Ventilation Fan",
      description: "Controls poultry house ventilation & temperature reduction",
      icon: Fan,
      isActive: deviceStates.fan,
      onToggle: onToggleFan,
    },
    {
      id: "heat",
      name: "Brooder Heat Lamp",
      description: "Infrared thermal lamp for chick brooding & low temp compensation",
      icon: Lightbulb,
      isActive: deviceStates.heat,
      onToggle: onToggleHeat,
    },
    {
      id: "pump",
      name: "Main Water Pump",
      description: "Refills main storage reservoir and feeder drinking lines",
      icon: Droplets,
      isActive: deviceStates.pump,
      onToggle: onTogglePump,
    },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Automation Mode Banner Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                automationEnabled ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
              }`}
            >
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-sm font-semibold text-foreground">
                  System Automation Mode
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    automationEnabled
                      ? "bg-accent/10 text-accent"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {automationEnabled ? "Autonomous Active" : "Manual Override"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {automationEnabled
                  ? "Microcontroller automatically triggers relays based on sensor threshold rules."
                  : "Manual control enabled. Sensor automation is bypassed for manual operator commands."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleAutomation}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                automationEnabled
                  ? "bg-surface-muted hover:bg-border text-foreground border border-border"
                  : "bg-accent text-accent-foreground hover:opacity-90 shadow-sm"
              }`}
            >
              {automationEnabled ? "Switch to Manual Mode" : "Restore Auto Automation"}
            </button>
          </div>
        </div>
      </div>

      {/* Actuator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actuators.map((actuator) => {
          const Icon = actuator.icon
          return (
            <div
              key={actuator.id}
              className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      actuator.isActive
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={20} className={actuator.isActive ? "animate-spin" : ""} />
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      actuator.isActive
                        ? "bg-accent/10 text-accent"
                        : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    {actuator.isActive ? "RUNNING" : "STANDBY"}
                  </span>
                </div>

                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {actuator.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 mb-6 leading-relaxed">
                  {actuator.description}
                </p>
              </div>

              <div>
                <button
                  onClick={actuator.onToggle}
                  className={`w-full h-11 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                    actuator.isActive
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                      : "bg-accent text-accent-foreground hover:opacity-90 shadow-sm"
                  }`}
                >
                  <Zap size={14} />
                  <span>{actuator.isActive ? "Deactivate Relay" : "Engage Relay"}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Safety Notice Footer */}
      <div className="p-4 rounded-2xl bg-surface-muted border border-border text-xs text-muted-foreground flex items-start gap-3">
        <ShieldAlert size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground block mb-0.5">
            Hardware Safety Interlock Notice
          </span>
          <span>
            Direct manual actuator commands override preset temperature and level thresholds. Ensure
            broiler conditions remain within safe physiological limits before overriding fans or
            heat lamps.
          </span>
        </div>
      </div>
    </div>
  )
}
