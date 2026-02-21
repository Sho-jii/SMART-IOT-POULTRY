"use client"

import { useEffect, useState, useRef } from "react"
import { ref, get } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Utensils, RefreshCw, Calendar, ChevronRight } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"
import { Bar } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface FeedingAnalyticsProps {
  className?: string
}

interface FeedingDataPoint {
  id?: string
  timestamp: number
  gramsDispensed: number
  chickenCount?: number
  ageGroup?: string
}

export default function FeedingAnalytics({ className = "" }: FeedingAnalyticsProps) {
  const [chartPeriod, setChartPeriod] = useState("day")
  const [comparisonMode, setComparisonMode] = useState<"none" | "previous">("none")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentData, setCurrentData] = useState<FeedingDataPoint[]>([])
  const [comparisonData, setComparisonData] = useState<FeedingDataPoint[]>([])
  const chartRef = useRef<any>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: "Food Dispensed (g)",
        data: [],
        borderColor: "#4A7C59",
        backgroundColor: "rgba(74, 124, 89, 0.3)",
        tension: 0.4,
      },
    ],
  })
  const [totalFeedDispensed, setTotalFeedDispensed] = useState<number>(0)
  const [averageFeedPerDay, setAverageFeedPerDay] = useState<number>(0)

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark")
      setIsDarkMode(isDark)
    }

    checkDarkMode()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          checkDarkMode()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  // Fetch feeding data
  const fetchFeedingData = async () => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Firebase not initialized")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const feedingRef = ref(firebase.database, "/feedingLogs")
      const snapshot = await get(feedingRef)
      const data = snapshot.val()

      if (!data) {
        setError("No feeding data found in Firebase")
        setIsLoading(false)
        return
      }

      processFeedingData(data)
    } catch (err: any) {
      console.error("Error fetching feeding data:", err)
      setError(`Error: ${err.message}`)
      setIsLoading(false)
    }
  }

  const processFeedingData = (data: any) => {
    try {
      let dataArray: FeedingDataPoint[] = []

      if (typeof data === "object" && data !== null) {
        dataArray = Object.entries(data).map(([key, value]: [string, any]) => {
          return {
            id: key,
            timestamp: typeof value.timestamp === "string" ? Number(value.timestamp) : value.timestamp || 0,
            gramsDispensed:
              typeof value.gramsDispensed === "string" ? Number(value.gramsDispensed) : value.gramsDispensed || 0,
            chickenCount: value.chickenCount || 0,
            ageGroup: value.ageGroup || "adult",
          }
        })
      }

      dataArray = dataArray.filter((point) => point.timestamp > 0 && point.gramsDispensed > 0)

      if (dataArray.length === 0) {
        setError("No valid feeding data points found")
        setIsLoading(false)
        return
      }

      dataArray.sort((a, b) => a.timestamp - b.timestamp)

      const totalFeed = dataArray.reduce((sum, point) => sum + point.gramsDispensed, 0)
      setTotalFeedDispensed(totalFeed)

      const firstDay = new Date(dataArray[0].timestamp * 1000).setHours(0, 0, 0, 0)
      const lastDay = new Date().setHours(23, 59, 59, 999)
      const daysDiff = Math.max(1, Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24)))
      setAverageFeedPerDay(totalFeed / daysDiff)

      const now = Math.floor(Date.now() / 1000)
      let comparisonTimeRange: { start: number; end: number } = { start: 0, end: 0 }
      let currentTimeRange: { start: number; end: number } = { start: 0, end: 0 }

      switch (chartPeriod) {
        case "day":
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayStart = Math.floor(today.getTime() / 1000)
          const todayEnd = now

          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          yesterday.setHours(0, 0, 0, 0)
          const yesterdayStart = Math.floor(yesterday.getTime() / 1000)
          const yesterdayEnd = todayStart - 1

          currentTimeRange = { start: todayStart, end: todayEnd }
          comparisonTimeRange = { start: yesterdayStart, end: yesterdayEnd }
          break

        case "week":
          const thisWeekStart = new Date()
          thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
          thisWeekStart.setHours(0, 0, 0, 0)
          const thisWeekStartTime = Math.floor(thisWeekStart.getTime() / 1000)

          const lastWeekStart = new Date(thisWeekStart)
          lastWeekStart.setDate(lastWeekStart.getDate() - 7)
          const lastWeekStartTime = Math.floor(lastWeekStart.getTime() / 1000)
          const lastWeekEndTime = thisWeekStartTime - 1

          currentTimeRange = { start: thisWeekStartTime, end: now }
          comparisonTimeRange = { start: lastWeekStartTime, end: lastWeekEndTime }
          break

        case "month":
          const thisMonthStart = new Date()
          thisMonthStart.setDate(1)
          thisMonthStart.setHours(0, 0, 0, 0)
          const thisMonthStartTime = Math.floor(thisMonthStart.getTime() / 1000)

          const lastMonthStart = new Date(thisMonthStart)
          lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
          const lastMonthStartTime = Math.floor(lastMonthStart.getTime() / 1000)

          const lastMonthEnd = new Date(thisMonthStart)
          lastMonthEnd.setSeconds(lastMonthEnd.getSeconds() - 1)
          const lastMonthEndTime = Math.floor(lastMonthEnd.getTime() / 1000)

          currentTimeRange = { start: thisMonthStartTime, end: now }
          comparisonTimeRange = { start: lastMonthStartTime, end: lastMonthEndTime }
          break

        default:
          currentTimeRange = { start: now - 24 * 60 * 60, end: now }
          comparisonTimeRange = { start: now - 2 * 24 * 60 * 60, end: now - 24 * 60 * 60 }
      }

      const filteredData = dataArray.filter(
        (point) => point.timestamp >= currentTimeRange.start && point.timestamp <= currentTimeRange.end,
      )

      const filteredComparisonData = dataArray.filter(
        (point) => point.timestamp >= comparisonTimeRange.start && point.timestamp <= comparisonTimeRange.end,
      )

      setCurrentData(filteredData)
      setComparisonData(filteredComparisonData)

      updateChartData(filteredData, filteredComparisonData)

      setIsLoading(false)
    } catch (err: any) {
      console.error("Error processing feeding data:", err)
      setError(`Error processing data: ${err.message}`)
      setIsLoading(false)
    }
  }

  const updateChartData = (dataToShow: FeedingDataPoint[], compData: FeedingDataPoint[]) => {
    const labels: string[] = []
    const feedData: (number | null)[] = []
    const compFeedData: (number | null)[] = []

    if (chartPeriod === "day") {
      const hourlyData: { [hour: number]: number } = {}
      dataToShow.forEach((point) => {
        const date = new Date(point.timestamp * 1000)
        const hour = date.getHours()
        hourlyData[hour] = (hourlyData[hour] || 0) + point.gramsDispensed
      })

      for (let hour = 0; hour < 24; hour++) {
        const hourStr = `${hour.toString().padStart(2, "0")}:00`
        labels.push(hourStr)
        feedData.push(hourlyData[hour] || 0)
      }

      if (comparisonMode === "previous") {
        const compHourlyData: { [hour: number]: number } = {}
        compData.forEach((point) => {
          const date = new Date(point.timestamp * 1000)
          const hour = date.getHours()
          compHourlyData[hour] = (compHourlyData[hour] || 0) + point.gramsDispensed
        })
        for (let hour = 0; hour < 24; hour++) {
          compFeedData.push(compHourlyData[hour] || 0)
        }
      }
    } else if (chartPeriod === "week") {
      const dailyData: { [day: number]: number } = {}
      dataToShow.forEach((point) => {
        const date = new Date(point.timestamp * 1000)
        const day = date.getDay()
        dailyData[day] = (dailyData[day] || 0) + point.gramsDispensed
      })

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      for (let day = 0; day < 7; day++) {
        labels.push(dayNames[day])
        feedData.push(dailyData[day] || 0)
      }

      if (comparisonMode === "previous") {
        const compDailyData: { [day: number]: number } = {}
        compData.forEach((point) => {
          const date = new Date(point.timestamp * 1000)
          const day = date.getDay()
          compDailyData[day] = (compDailyData[day] || 0) + point.gramsDispensed
        })
        for (let day = 0; day < 7; day++) {
          compFeedData.push(compDailyData[day] || 0)
        }
      }
    } else if (chartPeriod === "month") {
      const monthlyData: { [date: number]: number } = {}
      dataToShow.forEach((point) => {
        const date = new Date(point.timestamp * 1000)
        const day = date.getDate()
        monthlyData[day] = (monthlyData[day] || 0) + point.gramsDispensed
      })

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

      for (let day = 1; day <= daysInMonth; day++) {
        labels.push(day.toString())
        feedData.push(monthlyData[day] || 0)
      }

      if (comparisonMode === "previous") {
        const compMonthlyData: { [date: number]: number } = {}
        compData.forEach((point) => {
          const date = new Date(point.timestamp * 1000)
          const day = date.getDate()
          compMonthlyData[day] = (compMonthlyData[day] || 0) + point.gramsDispensed
        })

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        const daysInLastMonth = new Date(lastMonthYear, lastMonth + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day++) {
          if (day <= daysInLastMonth) {
            compFeedData.push(compMonthlyData[day] || 0)
          } else {
            compFeedData.push(null)
          }
        }
      }
    }

    const datasets = [
      {
        label: "Food Dispensed (g)",
        data: feedData,
        borderColor: "#4A7C59",
        backgroundColor: "rgba(74, 124, 89, 0.35)",
        tension: 0.4,
      },
    ]

    if (comparisonMode === "previous") {
      datasets.push({
        label: getPreviousPeriodLabel(),
        data: compFeedData,
        borderColor: "#D4A843",
        backgroundColor: "rgba(212, 168, 67, 0.25)",
        tension: 0.4,
      })
    }

    setChartData({
      labels,
      datasets,
    })
  }

  const getPreviousPeriodLabel = (): string => {
    switch (chartPeriod) {
      case "day":
        return "Yesterday"
      case "week":
        return "Last Week"
      case "month":
        return "Last Month"
      default:
        return "Previous Period"
    }
  }

  const handlePeriodChange = (period: string) => {
    setChartPeriod(period)
    fetchFeedingData()
  }

  const toggleComparisonMode = () => {
    const newMode = comparisonMode === "none" ? "previous" : "none"
    setComparisonMode(newMode)
    updateChartData(currentData, comparisonData)
  }

  useEffect(() => {
    fetchFeedingData()

    const refreshInterval = setInterval(() => {
      fetchFeedingData()
    }, 60000)

    return () => clearInterval(refreshInterval)
  }, [chartPeriod, comparisonMode])

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
          },
          ticks: {
            color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
            font: { family: "DM Sans, system-ui, sans-serif", size: 11 },
          },
          title: {
            display: true,
            text: "Grams",
            color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            font: { family: "DM Sans, system-ui, sans-serif", size: 12 },
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
            font: { family: "DM Sans, system-ui, sans-serif", size: 11 },
          },
          grid: {
            color: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
          },
        },
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
            font: { family: "Outfit, system-ui, sans-serif", size: 12 },
            usePointStyle: true,
            pointStyle: "rectRounded",
          },
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: isDarkMode ? "rgba(30, 28, 24, 0.9)" : "rgba(255, 255, 255, 0.95)",
          titleColor: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.8)",
          bodyColor: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: { family: "Outfit, system-ui, sans-serif" },
          bodyFont: { family: "DM Sans, system-ui, sans-serif" },
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || ""
              if (label) {
                label += ": "
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + "g"
              }
              return label
            },
          },
        },
      },
    }
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-border/50">
        <h2 className="font-heading text-lg font-semibold flex items-center text-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-sage flex items-center justify-center mr-3">
            <Utensils size={16} className="text-white" />
          </div>
          Food Dispensing Analytics
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-border/50">
            {["day", "week", "month"].map((period) => (
              <button
                key={period}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartPeriod === period
                    ? "bg-sage text-white"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => handlePeriodChange(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={toggleComparisonMode}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${comparisonMode !== "none"
                ? "bg-harvest/20 border-harvest/40 text-harvest"
                : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            title="Compare with previous period"
          >
            <Calendar size={14} className="inline-block mr-1" />
            Compare
          </button>
          <button
            onClick={() => fetchFeedingData()}
            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-sage/30 border-t-sage"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-80">
            <div className="text-brick font-heading font-medium mb-2">{error}</div>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
              Make sure your system is sending feeding data to the /feedingLogs path in Firebase. The data should
              include timestamp, gramsDispensed, chickenCount, and ageGroup fields.
            </p>
            <button
              onClick={() => fetchFeedingData()}
              className="px-4 py-2 bg-gradient-sage text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="h-80">
              <Bar ref={chartRef} data={chartData} options={getChartOptions()} />
            </div>

            {/* Summary statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/40 backdrop-blur-sm p-4 rounded-xl border border-border/30">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Feed Dispensed</h3>
                <p className="text-2xl font-heading font-bold text-sage">
                  {formatNumber(totalFeedDispensed)}g
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(totalFeedDispensed / 1000).toFixed(2)}kg total since tracking began
                </p>
              </div>
              <div className="bg-muted/40 backdrop-blur-sm p-4 rounded-xl border border-border/30">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Daily Feed</h3>
                <p className="text-2xl font-heading font-bold text-harvest">
                  {formatNumber(averageFeedPerDay)}g
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(averageFeedPerDay / 1000).toFixed(2)}kg per day on average
                </p>
              </div>
            </div>

            {/* View options */}
            <div className="mt-6 border-t border-border/30 pt-4">
              <h3 className="text-sm font-heading font-medium text-foreground mb-3">View Data By Period</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { period: "day", label: "Today's Data" },
                  { period: "week", label: "This Week" },
                  { period: "month", label: "This Month" },
                ].map((item) => (
                  <button
                    key={item.period}
                    onClick={() => handlePeriodChange(item.period)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${chartPeriod === item.period
                        ? "bg-sage/15 text-sage border border-sage/30"
                        : "bg-muted/40 text-muted-foreground border border-border/30 hover:text-foreground"
                      }`}
                  >
                    {item.label}
                    <ChevronRight size={14} className="ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
