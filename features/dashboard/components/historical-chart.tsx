"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { ref, get } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { HistoryDataPoint } from "../types"
import { Activity, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface HistoricalChartProps {
  className?: string
}

export function HistoricalChart({ className = "" }: HistoricalChartProps) {
  const [chartPeriod, setChartPeriod] = useState<"day" | "week" | "month">("day")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allData, setAllData] = useState<HistoryDataPoint[]>([])
  const [visibleData, setVisibleData] = useState<HistoryDataPoint[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pointsPerPage] = useState(24)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detect dark mode changes
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

  const fetchHistoricalData = useCallback(async () => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Firebase not initialized")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const historyRef = ref(firebase.database, "/history")
      const snapshot = await get(historyRef)
      const data = snapshot.val()

      if (!data) {
        setAllData([])
        setVisibleData([])
        setIsLoading(false)
        return
      }

      let dataArray: HistoryDataPoint[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        ...value,
        timestamp: typeof value.timestamp === "string" ? Number(value.timestamp) : value.timestamp,
        temperature: typeof value.temperature === "string" ? Number(value.temperature) : value.temperature,
        humidity: typeof value.humidity === "string" ? Number(value.humidity) : value.humidity,
      }))

      dataArray = dataArray.filter(
        (point) =>
          point.timestamp > 0 &&
          (point.temperature !== undefined || point.humidity !== undefined),
      )

      dataArray.sort((a, b) => a.timestamp - b.timestamp)
      setAllData(dataArray)
      filterDataByPeriod(dataArray, chartPeriod)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Error fetching historical telemetry:", err)
      setError(err.message)
      setIsLoading(false)
    }
  }, [chartPeriod])

  useEffect(() => {
    fetchHistoricalData()
  }, [fetchHistoricalData])

  const filterDataByPeriod = (data: HistoryDataPoint[], period: "day" | "week" | "month") => {
    if (data.length === 0) {
      setVisibleData([])
      setTotalPages(1)
      setCurrentPage(0)
      return
    }

    const now = Math.floor(Date.now() / 1000)
    let cutoff = 0

    switch (period) {
      case "day":
        cutoff = now - 24 * 60 * 60
        break
      case "week":
        cutoff = now - 7 * 24 * 60 * 60
        break
      case "month":
        cutoff = now - 30 * 24 * 60 * 60
        break
    }

    const filtered = data.filter((d) => d.timestamp >= cutoff)
    const pages = Math.max(1, Math.ceil(filtered.length / pointsPerPage))
    setTotalPages(pages)

    const startIndex = Math.max(0, filtered.length - pointsPerPage)
    setVisibleData(filtered.slice(startIndex))
    setCurrentPage(pages - 1)
  }

  const handlePeriodChange = (period: "day" | "week" | "month") => {
    setChartPeriod(period)
    filterDataByPeriod(allData, period)
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      const start = newPage * pointsPerPage
      setVisibleData(allData.slice(start, start + pointsPerPage))
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      const start = newPage * pointsPerPage
      setVisibleData(allData.slice(start, start + pointsPerPage))
    }
  }

  // Chart configuration
  const formatLabel = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    if (chartPeriod === "day") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString([], { month: "numeric", day: "numeric", hour: "2-digit" })
  }

  const labels = visibleData.map((d) => formatLabel(d.timestamp))
  const tempData = visibleData.map((d) => d.temperature ?? null)
  const humidityData = visibleData.map((d) => d.humidity ?? null)

  const chartData = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: tempData,
        borderColor: isDarkMode ? "hsl(142 45% 55%)" : "hsl(142 45% 33%)",
        backgroundColor: isDarkMode ? "hsla(142, 45%, 55%, 0.08)" : "hsla(142, 45%, 33%, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        yAxisID: "y",
      },
      {
        label: "Humidity (%)",
        data: humidityData,
        borderColor: isDarkMode ? "hsl(204 55% 65%)" : "hsl(204 45% 46%)",
        backgroundColor: "transparent",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        yAxisID: "y1",
      },
    ],
  }

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
          color: isDarkMode ? "#a3a3a3" : "#525252",
          font: {
            size: 12,
            weight: 500,
          },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#1f1f1f" : "#ffffff",
        titleColor: isDarkMode ? "#f5f5f5" : "#171717",
        bodyColor: isDarkMode ? "#d4d4d4" : "#404040",
        borderColor: isDarkMode ? "#333333" : "#e5e5e5",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? "#737373" : "#a3a3a3",
          font: { size: 11 },
          maxRotation: 0,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        },
        ticks: {
          color: isDarkMode ? "#737373" : "#a3a3a3",
          font: { size: 11 },
        },
        title: {
          display: false,
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: isDarkMode ? "#737373" : "#a3a3a3",
          font: { size: 11 },
        },
        title: {
          display: false,
        },
      },
    },
  }

  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 shadow-sm ${className}`}>
      {/* Header with Title + Range Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
            <Activity size={16} />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Environmental Telemetry Trends
            </h2>
            <p className="text-xs text-muted-foreground">
              Temperature & humidity over time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-surface-muted border border-border">
            {(["day", "week", "month"] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  chartPeriod === period
                    ? "bg-surface text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {period === "day" ? "Today" : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={fetchHistoricalData}
            disabled={isLoading}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors border border-border"
            title="Refresh chart"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : ""} />
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[280px] w-full">
        {isLoading && visibleData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-accent" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-xs text-destructive">
            {error}
          </div>
        ) : visibleData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No historical telemetry recorded for this period
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg bg-surface-muted hover:bg-border text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="p-1.5 rounded-lg bg-surface-muted hover:bg-border text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
