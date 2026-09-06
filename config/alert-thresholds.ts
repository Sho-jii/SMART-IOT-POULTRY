/**
 * Alert thresholds and system parameter constants for the poultry farming monitoring system.
 */

// Temperature Thresholds (°C)
export const TEMP_OPTIMAL_MIN = 24
export const TEMP_OPTIMAL_MAX = 32
export const TEMP_HIGH_THRESHOLD = 32
export const TEMP_LOW_THRESHOLD = 24

// Humidity Thresholds (%)
export const HUMIDITY_OPTIMAL_MIN = 50
export const HUMIDITY_OPTIMAL_MAX = 70

// Food Level Thresholds (%)
export const FOOD_CRITICAL_LOW_THRESHOLD = 20
export const FOOD_MEDIUM_THRESHOLD = 50

// Water Tank Level Thresholds (%)
export const WATER_MAIN_LOW_THRESHOLD = 20
export const WATER_DRINKER_LOW_THRESHOLD = 30

// Hydration Requirements for 45-day broilers (ml/bird/day)
export const HYDRATION_ALERT_THRESHOLD = 120
export const HYDRATION_WARNING_THRESHOLD = 180
export const HYDRATION_OPTIMAL_MIN = 180
export const HYDRATION_OPTIMAL_MAX = 250

// Flow and Dispense Defaults
export const DEFAULT_FLOW_RATE = 100 // ml per second
export const DEFAULT_FILL_DURATION = 30 // seconds
