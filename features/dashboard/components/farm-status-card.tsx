"use client"

import { Wifi, WifiOff, AlertTriangle, RefreshCw, Bot, ShieldCheck } from "lucide-react"

interface FarmStatusCardProps {
  isConnected: boolean
  activeAlertCount: number
  lastUpdated: Date | null
  automationEnabled: boolean
  isRefreshing: boolean
  onRefresh: () => void
  onToggleAutomation: () => void
}

export function FarmStatusCard({
  isConnected,
  activeAlertCount,
  lastUpdated,
  automationEnabled,
  isRefreshing,
  onRefresh,
  onToggleAutomation,
}: FarmStatusCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              System Telemetry Status
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live IoT controller & sensor stream
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? "bg-accent/10 text-accent"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isConnected ? "Online & Synced" : "Disconnected"}</span>
          </div>
        </div>

        {/* 3-column quick metric strip */}
        <div className="grid grid-cols-3 gap-3 my-4 p-4 rounded-xl bg-surface-muted border border-border">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">
              Active Alerts
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {activeAlertCount > 0 ? (
                <AlertTriangle size={15} className="text-destructive" />
              ) : (
                <ShieldCheck size={15} className="text-accent" />
              )}
              <span
                className={`font-heading text-lg font-bold tabular-nums ${
                  activeAlertCount > 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {activeAlertCount}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">
              Automation Mode
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Bot size={15} className={automationEnabled ? "text-accent" : "text-muted-foreground"} />
              <span className="font-heading text-sm font-semibold text-foreground">
                {automationEnabled ? "Auto" : "Manual"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">
              Last Sync
            </span>
            <span className="font-heading text-sm font-semibold text-foreground mt-1 block tabular-nums">
              {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-2 pt-3 border-t border-border">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-muted hover:bg-border text-foreground font-medium text-xs transition-colors disabled:opacity-50 border border-border"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin text-accent" : "text-muted-foreground"} />
          <span>{isRefreshing ? "Refreshing..." : "Sync Sensors"}</span>
        </button>

        <button
          onClick={onToggleAutomation}
          className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs transition-colors ${
            automationEnabled
              ? "bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20"
              : "bg-surface-muted text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <Bot size={14} />
          <span>{automationEnabled ? "Auto Enabled" : "Enable Auto"}</span>
        </button>
      </div>
    </div>
  )
}
