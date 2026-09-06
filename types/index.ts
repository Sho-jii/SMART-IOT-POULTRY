export type ConnectionStatus = "connected" | "connecting" | "offline" | "error"

export interface SystemEvent {
  id: string
  timestamp: number
  type: string
  description?: string
}

export type TimeFilter = "day" | "week" | "month" | "all"
