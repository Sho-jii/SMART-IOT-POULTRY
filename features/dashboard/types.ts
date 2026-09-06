export interface SensorData {
  temperature: number | null
  humidity: number | null
  foodLevel: number | null
  waterLevelMain: number | null
  waterLevelDrinker: number | null
  lastUpdated: Date | null
}

export interface AlertsState {
  highTemperature: boolean
  lowTemperature: boolean
  lowFood: boolean
  lowWaterMain: boolean
  lowWaterDrinker: boolean
  lowHydration: boolean
}

export interface AlertEvent {
  id: string
  timestamp: number
  type: string
  description: string
}

export interface HistoryDataPoint {
  id?: string
  timestamp: number
  temperature?: number
  humidity?: number
}
