import { ref, get, set } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { calculateRecommendedGrams, calculateServoOpenTime } from "./feeding-utils"

export async function runFeedingScheduleIfDue() {
  const firebase = initFirebase()
  if (!firebase?.database) return

  const hour = new Date().getHours()
  const scheduleRef = ref(firebase.database, `/feedingSchedule/${hour}`)
  const scheduleSnap = await get(scheduleRef)
  if (!scheduleSnap.exists()) return

  const shouldFeed = scheduleSnap.val()
  if (!shouldFeed) return

  const lastRunRef = ref(firebase.database, "/feedingScheduleLastRun")
  const lastRunSnap = await get(lastRunRef)
  const lastRunHour = lastRunSnap.val()
  if (lastRunHour === hour) return // already executed this hour

  const settingsSnap = await get(ref(firebase.database, "/feedingSettings"))
  const settings = settingsSnap.val() || {}
  const ageGroup = settings.ageGroup || "adult"
  const chickenCount = settings.chickenCount || 10

  const grams = calculateRecommendedGrams(ageGroup, chickenCount)
  const duration = calculateServoOpenTime(grams)

  await set(ref(firebase.database, "/controls/feedDuration"), duration)
  await set(ref(firebase.database, "/controls/feed"), true)
  await set(ref(firebase.database, "/feedingScheduleLastRun"), hour)

  // Log to feedingLogs
  const timestamp = Math.floor(Date.now() / 1000)
  await set(ref(firebase.database, `/feedingLogs/${timestamp}`), {
    timestamp,
    gramsDispensed: grams,
    ageGroup,
    chickenCount,
    servoOpenTime: duration,
    feedType: "scheduled",
  })
}
