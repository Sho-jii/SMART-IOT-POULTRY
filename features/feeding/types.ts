export interface FeedingDataPoint {
  id?: string
  timestamp: number
  gramsDispensed: number
  chickenCount?: number
  ageGroup?: string
}

export interface AgeGroupInfo {
  label: string
  ageRange: string
  recommendedGrams: number
  description: string
}

export interface FeedingSettings {
  ageGroup: string
  chickenCount: number
  lastUpdated?: number
}

export type FeedingSchedule = Record<number, boolean>
