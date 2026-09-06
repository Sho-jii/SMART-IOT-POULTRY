"use client"

import { useEffect, useState, useCallback } from "react"
import { ref, get } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { FeedingDataPoint } from "../types"
import { Utensils, RefreshCw, BarChart2 } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface FeedingAnalyticsChartsProps {
  className?: string
}

export function FeedingAnalyticsCharts({ className = "" }: FeedingAnalyticsChartsProps) {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allLogs, setAllLogs] = useState<FeedingDataPoint[]>([])
  const [chartLabels, setChartLabels] = useState<string[]>([])
  const [chartValues, setChartValues] = useState<number[]>([])
  const [totalGrams, setTotalGrams] = useState(0)
  const [averageDailyGrams, setAverageDailyGrams] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }
    checkDark()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === "class") checkDark()
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  const fetchLogs = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Firebase not initialized")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const logsRef = ref(firebase.database, "/feedingLogs")
      const snapshot = await get(logsRef)
      const data = snapshot.val()

      if (!data) {
        setAllLogs([])
        setChartLabels([])
        setChartValues([])
        setTotalGrams(0)
        setAverageDailyGrams(0)
        setIsLoading(false)
        return
      }

      const logsArray: FeedingDataPoint[] = Object.entries(data)
        .map(([key, val]: [string, any]) => ({
          id: key,
          ...val,
          timestamp: typeof val.timestamp === "string" ? Number(val.timestamp) : val.timestamp,
          gramsDispensed: typeof val.gramsDispensed === "string" ? Number(val.gramsDispensed) : val.gramsDispensed || 0,
        }))
        .filter((item) => item.timestamp > 0 && item.gramsDispensed > 0)
        .sort((a, b) => a.timestamp - b.timestamp)

      setAllLogs(logsArray)
      processChartData(logsArray, period)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Error fetching feeding logs:", err)
      setError(err.message)
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const processChartData = (logs: FeedingDataPoint[], selectedPeriod: "day" | "week" | "month") => {
    const now = Math.floor(Date.now() / 1000)
    let cutoff = 0

    switch (selectedPeriod) {
      case "day": {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        cutoff = Math.floor(today.getTime() / 1000)
        break
      }
      case "week":
        cutoff = now - 7 * 24 * 60 * 60
        break
      case "month":
        cutoff = now - 30 * 24 * 60 * 60
        break
    }

    const filtered = logs.filter((l) => l.timestamp >= cutoff)
    const sum = filtered.reduce((acc, curr) => acc + curr.gramsDispensed, 0)
    setTotalGrams(sum)

    if (selectedPeriod === "day") {
      // Group by hour (0 to 23)
      const hourlyMap: Record<number, number> = {}
      for (let i = 0; i < 24; i++) hourlyMap[i] = 0

      filtered.forEach((log) => {
        const hour = new Date(log.timestamp * 1000).getHours()
        hourlyMap[hour] = (hourlyMap[hour] || 0) + log.gramsDispensed
      })

      const labels = Array.from({ length: 24 }).map((_, i) => `${i.toString().padStart(2, "0")}:00`)
      const values = Array.from({ length: 24 }).map((_, i) => hourlyMap[i] || 0)

      setChartLabels(labels)
      setChartValues(values)
      setAverageDailyGrams(sum)
    } else {
      // Group by date (day)
      const dailyMap: Record<string, number> = {}
      filtered.forEach((log) => {
        const dateKey = new Date(log.timestamp * 1000).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + log.gramsDispensed
      })

      const labels = Object.keys(dailyMap)
      const values = Object.values(dailyMap)

      setChartLabels(labels)
      setChartValues(values)
      const dayCount = Math.max(1, labels.length)
      setAverageDailyGrams(Math.round(sum / dayCount))
    }
  }

  const handlePeriodChange = (newPeriod: "day" | "week" | "month") => {
    setPeriod(newPeriod)
    processChartData(allLogs, newPeriod)
  }

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Feed Dispensed (g)",
        data: chartValues,
        backgroundColor: isDarkMode ? "hsl(142 45% 45%)" : "hsl(142 45% 33%)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#1f1f1f" : "#ffffff",
        titleColor: isDarkMode ? "#f5f5f5" : "#171717",
        bodyColor: isDarkMode ? "#d4d4d4" : "#404040",
        borderColor: isDarkMode ? "#333333" : "#e5e5e5",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: isDarkMode ? "#737373" : "#a3a3a3",
          font: { size: 11 },
          maxRotation: 0,
        },
      },
      y: {
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        },
        ticks: {
          color: isDarkMode ? "#737373" : "#a3a3a3",
          font: { size: 11 },
        },
      },
    },
  }

  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 shadow-sm ${className}`}>
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
            <BarChart2 size={16} />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Feed Consumption Analytics
            </h2>
            <p className="text-xs text-muted-foreground">
              Historical feeding volumes & intake distribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-surface-muted border border-border">
            {(["day", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  period === p
                    ? "bg-surface text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "day" ? "Today" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted border border-border transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : ""} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-surface-muted border border-border">
          <span className="text-[11px] font-medium text-muted-foreground block">
            Total Dispensed
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-heading text-xl font-bold text-foreground tabular-nums">
              {totalGrams >= 1000 ? (totalGrams / 1000).toFixed(2) : totalGrams}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalGrams >= 1000 ? "kg" : "g"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-muted border border-border">
          <span className="text-[11px] font-medium text-muted-foreground block">
            Daily Average
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-heading text-xl font-bold text-foreground tabular-nums">
              {averageDailyGrams >= 1000 ? (averageDailyGrams / 1000).toFixed(2) : averageDailyGrams}
            </span>
            <span className="text-xs text-muted-foreground">
              {averageDailyGrams >= 1000 ? "kg/day" : "g/day"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-muted border border-border col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-muted-foreground block">
            Logged Events
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-heading text-xl font-bold text-foreground tabular-nums">
              {allLogs.length}
            </span>
            <span className="text-xs text-muted-foreground">cycles</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[260px] w-full">
        {isLoading && chartValues.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-accent" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-xs text-destructive">
            {error}
          </div>
        ) : chartValues.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No feeding events recorded for this period
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  )
}
