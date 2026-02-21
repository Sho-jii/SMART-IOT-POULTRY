"use client"

import { useEffect, useState, useRef } from "react"
import { ref, get } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Droplet, RefreshCw, Calendar, ChevronRight } from "lucide-react"
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

interface WaterUsageAnalyticsProps {
  className?: string
}

interface WaterDataPoint {
  id?: string
  timestamp: number
  volumeDispensed: number
}

export default function WaterUsageAnalytics({ className = "" }: WaterUsageAnalyticsProps) {
  const [chartPeriod, setChartPeriod] = useState("day")
  const [comparisonMode, setComparisonMode] = useState<"none" | "previous">("none")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentData, setCurrentData] = useState<WaterDataPoint[]>([])
  const [comparisonData, setComparisonData] = useState<WaterDataPoint[]>([])
  const chartRef = useRef<any>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: "Water Dispensed (ml)",
        data: [],
        borderColor: "#3D7EAA",
        backgroundColor: "rgba(61, 126, 170, 0.3)",
        tension: 0.4,
      },
    ],
  })
  const [totalWater, setTotalWater] = useState<number>(0)
  const [averageWaterPerDay, setAverageWaterPerDay] = useState<number>(0)

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

  // Fetch water data
  const fetchWaterData = async () => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Firebase not initialized")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const waterRef = ref(firebase.database, "/waterLogs")
      const snapshot = await get(waterRef)
      const data = snapshot.val()

      if (!data) {
        setError("No water data found in Firebase")
        setIsLoading(false)
        return
      }

      processWaterData(data)
    } catch (err: any) {
      console.error("Error fetching water data:", err)
      setError(`Error: ${err.message}`)
      setIsLoading(false)
    }
  }

  const processWaterData = (data: any) => {
    try {
      let dataArray: WaterDataPoint[] = []

      if (typeof data === "object" && data !== null) {
        dataArray = Object.entries(data).map(([key, value]: [string, any]) => {
          return {
            id: key,
            timestamp: typeof value.timestamp === "string" ? Number(value.timestamp) : value.timestamp || 0,
            volumeDispensed:
              typeof value.volumeDispensed === "string" ? Number(value.volumeDispensed) : value.volumeDispensed || 0,
          }
        })
      }

      dataArray = dataArray.filter((point) => point.timestamp > 0 && point.volumeDispensed > 0)

      if (dataArray.length === 0) {
        setError("No valid water data points found")
        setIsLoading(false)
        return
      }

      dataArray.sort((a, b) => a.timestamp - b.timestamp)

      const total = dataArray.reduce((sum, point) => sum + point.volumeDispensed, 0)
      setTotalWater(total)

      const firstDay = new Date(dataArray[0].timestamp * 1000).setHours(0, 0, 0, 0)
      const lastDay = new Date().setHours(23, 59, 59, 999)
      const daysDiff = Math.max(1, Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24)))
      setAverageWaterPerDay(total / daysDiff)

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
      console.error("Error processing water data:", err)
      setError(`Error processing data: ${err.message}`)
      setIsLoading(false)
    }
  }

  const updateChartData = (dataToShow: WaterDataPoint[], compData: WaterDataPoint[]) => {
    const labels: string[] = []
    const waterData: (number | null)[] = []
    const compWaterData: (number | null)[] = []

    if (chartPeriod === "day") {
      const hourlyData: { [hour: number]: number } = {}
      dataToShow.forEach((point) => {
        const date = new Date(point.timestamp * 1000)
        const hour = date.getHours()
        hourlyData[hour] = (hourlyData[hour] || 0) + point.volumeDispensed
      })
      for (let hour = 0; hour < 24; hour++) {
        labels.push(`${hour.toString().padStart(2, "0")}:00`)
        waterData.push(hourlyData[hour] || 0)
      }
      if (comparisonMode === "previous") {
        const compHourlyData: { [hour: number]: number } = {}
        compData.forEach((point) => {
          const date = new Date(point.timestamp * 1000)
          const hour = date.getHours()
          compHourlyData[hour] = (compHourlyData[hour] || 0) + point.volumeDispensed
        })
        for (let hour = 0; hour < 24; hour++) {
          compWaterData.push(compHourlyData[hour] || 0)
        }
      }
    } else if (chartPeriod === "week") {
      const dailyData: { [day: number]: number } = {}
      dataToShow.forEach((point) => {
        const date = new Date(point.timestamp * 1000)
        const day = date.getDay()
        dailyData[day] = (dailyData[day] || 0) + point.volumeDispensed
      })
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      for (let day = 0; day < 7; day++) {
        labels.push(dayNames[day])
        waterData.push(dailyData[day] || 0)
      }
      if (comparisonMode === "previous") {
        const compDailyData: { [day: number]: number } = {}
        compData.forEach((point) => {
          const date = new Date(point.timestamp * 1000)
          const day = date.getDay()
          compDailyData[day] = (compDailyData[day] || 0) + point.volumeDispensed
        })
        for (let day = 0; day < 7; day++) {
          compWaterData.push(compDailyData[day] || 0)
        }
      }
    } else if (chartPeriod === "month") {
      const monthlyData: { [date: number]: number } = {}
      dataToShow.forEach((point) => {
        const date = new Date(point.timestamp * 1000)
        const day = date.getDate()
        monthlyData[day] = (monthlyData[day] || 0) + point.volumeDispensed
      })
      const now = new Date()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        labels.push(day.toString())
        waterData.push(monthlyData[day] || 0)
      }
      if (comparisonMode === "previous") {
        const compMonthlyData: { [date: number]: number } = {}
        compData.forEach((point) => {
          const date = new Date(point.timestamp * 1000)
          const day = date.getDate()
          compMonthlyData[day] = (compMonthlyData[day] || 0) + point.volumeDispensed
        })
        for (let day = 1; day <= daysInMonth; day++) {
          compWaterData.push(compMonthlyData[day] || 0)
        }
      }
    }

    const datasets = [
      {
        label: "Water Dispensed (ml)",
        data: waterData,
        borderColor: "#3D7EAA",
        backgroundColor: "rgba(61, 126, 170, 0.35)",
        tension: 0.4,
      },
    ]

    if (comparisonMode === "previous") {
      datasets.push({
        label: getPreviousPeriodLabel(),
        data: compWaterData,
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
    fetchWaterData()
  }

  const toggleComparisonMode = () => {
    const newMode = comparisonMode === "none" ? "previous" : "none"
    setComparisonMode(newMode)
    updateChartData(currentData, comparisonData)
  }

  useEffect(() => {
    fetchWaterData()
    const refreshInterval = setInterval(() => {
      fetchWaterData()
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
            text: "Milliliters",
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
              if (label) label += ": "
              if (context.parsed.y !== null) label += context.parsed.y + "ml"
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
          <div className="w-8 h-8 rounded-lg bg-gradient-water flex items-center justify-center mr-3">
            <Droplet size={16} className="text-white" />
          </div>
          Water Usage Analytics
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-border/50">
            {["day", "week", "month"].map((period) => (
              <button
                key={period}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartPeriod === period
                    ? "bg-pond text-white"
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
            onClick={() => fetchWaterData()}
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
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-pond/30 border-t-pond"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-80">
            <div className="text-brick font-heading font-medium mb-2">{error}</div>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
              Make sure your system is sending water data to the /waterLogs path in Firebase. The data should include
              timestamp and volumeDispensed fields.
            </p>
            <button
              onClick={() => fetchWaterData()}
              className="px-4 py-2 bg-gradient-water text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
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
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Water Dispensed</h3>
                <p className="text-2xl font-heading font-bold text-pond">
                  {formatNumber(totalWater)}ml
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(totalWater / 1000).toFixed(2)}L total since tracking began
                </p>
              </div>
              <div className="bg-muted/40 backdrop-blur-sm p-4 rounded-xl border border-border/30">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Daily Usage</h3>
                <p className="text-2xl font-heading font-bold text-harvest">
                  {formatNumber(averageWaterPerDay)}ml
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(averageWaterPerDay / 1000).toFixed(2)}L per day on average
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
                        ? "bg-pond/15 text-pond border border-pond/30"
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
