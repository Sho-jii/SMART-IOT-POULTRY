export interface WaterDataPoint {
  id?: string
  timestamp: number
  volumeDispensed: number
  durationSeconds?: number
}

export interface WaterSettings {
  flowRate: number // ml per second
  fillDuration: number // seconds
  autoEnabled: boolean
}

export type WaterSchedule = Record<string, boolean>

export type HydrationStatus = "normal" | "warning" | "alert"
