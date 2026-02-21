"use client"

import { useEffect, useState, useRef } from "react"
import { ref, get } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Settings, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface HistoricalChartProps {
  className?: string
}

interface HistoryDataPoint {
  id?: string
  timestamp: number
  temperature?: number
  humidity?: number
}

export default function HistoricalChart({ className = "" }: HistoricalChartProps) {
  const [chartPeriod, setChartPeriod] = useState("day")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allData, setAllData] = useState<HistoryDataPoint[]>([])
  const [visibleData, setVisibleData] = useState<HistoryDataPoint[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pointsPerPage, setPointsPerPage] = useState(24)
  const chartRef = useRef<any>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: "Temperature (°C)",
        data: [],
        borderColor: "#C14533",
        backgroundColor: "rgba(193, 69, 51, 0.15)",
        tension: 0.4,
      },
      {
        label: "Humidity (%)",
        data: [],
        borderColor: "#3D7EAA",
        backgroundColor: "rgba(61, 126, 170, 0.15)",
        tension: 0.4,
      },
    ],
  })

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

  // Fetch historical data
  const fetchHistoricalData = async () => {
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
        setError("No historical data found in Firebase")
        setIsLoading(false)
        return
      }

      processHistoricalData(data)
    } catch (err: any) {
      console.error("Error fetching historical data:", err)
      setError(`Error: ${err.message}`)
      setIsLoading(false)
    }
  }

  const processHistoricalData = (data: any) => {
    try {
      let dataArray: HistoryDataPoint[] = []

      if (typeof data === "object" && data !== null) {
        dataArray = Object.entries(data).map(([key, value]: [string, any]) => {
          if (typeof value === "object" && value !== null) {
            return {
              id: key,
              timestamp: typeof value.timestamp === "string" ? Number(value.timestamp) : value.timestamp || 0,
              temperature: typeof value.temperature === "string" ? Number(value.temperature) : value.temperature,
              humidity: typeof value.humidity === "string" ? Number(value.humidity) : value.humidity,
            }
          } else if (typeof value === "number") {
            return { id: key, timestamp: value, temperature: null, humidity: null }
          } else {
            return { id: key, timestamp: 0, temperature: null, humidity: null }
          }
        })
      }

      dataArray = dataArray.filter(
        (point) => point.timestamp > 0 && (point.temperature !== undefined || point.humidity !== undefined),
      )

      if (dataArray.length === 0) {
        setError("No valid data points found")
        setIsLoading(false)
        return
      }

      dataArray.sort((a, b) => a.timestamp - b.timestamp)

      const now = Math.floor(Date.now() / 1000)
      let timeRange: number
      let pointsToShow: number

      switch (chartPeriod) {
        case "day":
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          timeRange = now - Math.floor(today.getTime() / 1000)
          pointsToShow = 24
          break
        case "week":
          timeRange = 7 * 24 * 60 * 60
          pointsToShow = 7 * 24
          break
        case "month":
          timeRange = 30 * 24 * 60 * 60
          pointsToShow = 30 * 24
          break
        default:
          timeRange = 24 * 60 * 60
          pointsToShow = 24
      }

      let startTime: number
      if (chartPeriod === "day") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        startTime = Math.floor(today.getTime() / 1000)
      } else {
        startTime = now - timeRange
      }

      const filteredData = dataArray.filter((point) => point.timestamp >= startTime)

      if (filteredData.length === 0) {
        if (chartPeriod === "day") {
          setError("No data available for today. Switch to Week or Month view to see historical data.")
          setIsLoading(false)
          setAllData([])
          setVisibleData([])
          setTotalPages(1)
          setCurrentPage(0)
          return
        }
      }

      const dataToUse = filteredData.length > 0 ? filteredData : dataArray

      setAllData(dataToUse)
      setPointsPerPage(pointsToShow)

      const pages = Math.ceil(dataToUse.length / pointsToShow)
      setTotalPages(pages > 0 ? pages : 1)
      setCurrentPage(pages > 0 ? pages - 1 : 0)

      updateVisibleData(dataToUse, pages - 1, pointsToShow)

      setIsLoading(false)
    } catch (err: any) {
      console.error("Error processing historical data:", err)
      setError(`Error processing data: ${err.message}`)
      setIsLoading(false)
    }
  }

  const updateVisibleData = (data: HistoryDataPoint[], page: number, pointsPerPage: number) => {
    const startIdx = page * pointsPerPage
    const endIdx = Math.min(startIdx + pointsPerPage, data.length)
    const dataToShow = data.slice(startIdx, endIdx)
    setVisibleData(dataToShow)
    updateChartData(dataToShow)
  }

  const updateChartData = (dataToShow: HistoryDataPoint[]) => {
    const labels: string[] = []
    const tempData: (number | null)[] = []
    const humidityData: (number | null)[] = []

    dataToShow.forEach((point) => {
      const date = new Date(point.timestamp * 1000)
      let timeStr

      if (chartPeriod === "day") {
        timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      } else if (chartPeriod === "week") {
        timeStr = date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })
      } else {
        timeStr = date.toLocaleDateString([], { month: "short", day: "numeric" })
      }

      labels.push(timeStr)
      tempData.push(point.temperature !== undefined ? point.temperature : null)
      humidityData.push(point.humidity !== undefined ? point.humidity : null)
    })

    setChartData({
      labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: tempData,
          borderColor: "#C14533",
          backgroundColor: "rgba(193, 69, 51, 0.15)",
          tension: 0.4,
          spanGaps: true,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: "Humidity (%)",
          data: humidityData,
          borderColor: "#3D7EAA",
          backgroundColor: "rgba(61, 126, 170, 0.15)",
          tension: 0.4,
          spanGaps: true,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    })
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateVisibleData(allData, newPage, pointsPerPage)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateVisibleData(allData, newPage, pointsPerPage)
    }
  }

  const handlePeriodChange = (period: string) => {
    setChartPeriod(period)
    setCurrentPage(0)
    fetchHistoricalData()
  }

  useEffect(() => {
    fetchHistoricalData()

    const refreshInterval = setInterval(() => {
      fetchHistoricalData()
    }, 60000)

    return () => clearInterval(refreshInterval)
  }, [chartPeriod])

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
          },
          ticks: {
            color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
            font: { family: "DM Sans, system-ui, sans-serif", size: 11 },
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
            pointStyle: "circle",
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
        },
      },
    }
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-border/50">
        <h2 className="font-heading text-lg font-semibold flex items-center text-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center mr-3">
            <Settings size={16} className="text-white" />
          </div>
          Historical Data
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-border/50">
            {["day", "week", "month"].map((period) => (
              <button
                key={period}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartPeriod === period
                    ? "bg-copper text-white"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => handlePeriodChange(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchHistoricalData()}
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-copper/30 border-t-copper"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-brick font-heading font-medium mb-2">{error}</div>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
              Make sure your Arduino is sending data to the /history path in Firebase. The data should include
              timestamp, temperature, and humidity fields.
            </p>
            <button
              onClick={() => fetchHistoricalData()}
              className="px-4 py-2 bg-gradient-warm text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="h-64">
              <Line ref={chartRef} data={chartData} options={getChartOptions()} />
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/30">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-muted-foreground">{`Page ${currentPage + 1} of ${totalPages}`}</span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
