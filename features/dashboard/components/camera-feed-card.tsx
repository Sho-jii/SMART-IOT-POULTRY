"use client"

import { useEffect, useState, useRef } from "react"
import { ref, get, set } from "firebase/database"
import { initFirebase } from "@/services/firebase/client"
import { Play, RefreshCw, Settings, X, Camera, Square } from "lucide-react"

interface CameraFeedCardProps {
  className?: string
}

export function CameraFeedCard({ className = "" }: CameraFeedCardProps) {
  const [cameraIP, setCameraIP] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLiveStream, setShowLiveStream] = useState(false)
  const [streamInterval, setStreamInterval] = useState<NodeJS.Timeout | null>(null)
  const [streamFps, setStreamFps] = useState(5)
  const [showSettings, setShowSettings] = useState(false)
  const [tempIP, setTempIP] = useState("")
  const [streamStatus, setStreamStatus] = useState<"inactive" | "loading" | "active" | "error">("inactive")

  const snapshotRef = useRef<HTMLImageElement>(null)
  const streamRef = useRef<HTMLImageElement>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const firebase = initFirebase()
    if (!firebase?.database) {
      setError("Firebase not initialized")
      setIsLoading(false)
      return
    }

    const cameraIPRef = ref(firebase.database, "/settings/cameraIP")
    get(cameraIPRef)
      .then((snapshot) => {
        if (!isMounted.current) return
        const ip = snapshot.val()
        if (ip) {
          setCameraIP(ip)
          setTempIP(ip)
          updateCameraFeed(ip)
        } else {
          setError("No camera IP configured")
        }
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted.current) return
        console.error("Error fetching camera IP:", err)
        setError("Failed to fetch camera IP")
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    return () => {
      if (streamInterval) clearInterval(streamInterval)
      if (streamRef.current) streamRef.current.src = ""
      setStreamStatus("inactive")
    }
  }, [streamInterval])

  const getCameraSnapshotUrl = (ip: string, timestamp: number, endpoint = "capture") => {
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      return `/api/camera-proxy?ip=${encodeURIComponent(ip)}&t=${timestamp}`
    }
    return `http://${ip}/${endpoint}?t=${timestamp}`
  }

  const updateCameraFeed = (ip: string) => {
    if (!ip) return
    const timestamp = new Date().getTime()
    if (snapshotRef.current) {
      setError(null)
      snapshotRef.current.src = getCameraSnapshotUrl(ip, timestamp, "capture")
      snapshotRef.current.onerror = () => {
        if (snapshotRef.current && isMounted.current) {
          snapshotRef.current.src = getCameraSnapshotUrl(ip, timestamp, "jpg")
          snapshotRef.current.onerror = () => {
            if (isMounted.current) setError("Failed to connect to camera (Check IP / Network)")
          }
        }
      }
      snapshotRef.current.onload = () => {
        if (isMounted.current) setError(null)
      }
    }
  }

  const startStream = () => {
    if (!cameraIP || !isMounted.current) return
    setError(null)
    setStreamStatus("loading")

    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:"
    if (isHttps) {
      // In HTTPS, use pseudo-stream via proxy to bypass mixed-content browser restrictions
      setupPseudoStream(streamFps)
      return
    }

    if (streamRef.current) {
      streamRef.current.src = ""
      streamRef.current.src = `http://${cameraIP}/stream`

      const timeoutId = setTimeout(() => {
        if (!isMounted.current) return
        if (streamRef.current && isMounted.current) {
          streamRef.current.src = `http://${cameraIP}:81/stream`
          const secondTimeoutId = setTimeout(() => {
            if (!isMounted.current) return
            setupPseudoStream(streamFps)
          }, 2000)
          streamRef.current.onload = () => {
            clearTimeout(secondTimeoutId)
            if (isMounted.current) setStreamStatus("active")
          }
        }
      }, 2000)

      streamRef.current.onload = () => {
        clearTimeout(timeoutId)
        if (isMounted.current) setStreamStatus("active")
      }

      streamRef.current.onerror = () => {
        if (!isMounted.current) return
        clearTimeout(timeoutId)
        console.log("Direct stream failed, trying pseudo-streaming...")
        setupPseudoStream(streamFps)
      }
    }
  }

  const setupPseudoStream = (fps: number) => {
    if (streamInterval) clearInterval(streamInterval)

    const interval = 1000 / fps
    const newInterval = setInterval(() => {
      if (!isMounted.current) return
      if (streamRef.current && isMounted.current) {
        const timestamp = new Date().getTime()
        streamRef.current.src = getCameraSnapshotUrl(cameraIP, timestamp, "capture")
      }
    }, interval)

    setStreamInterval(newInterval)
    setStreamStatus("active")

    if (streamRef.current) {
      streamRef.current.onload = () => {
        if (isMounted.current) setStreamStatus("active")
      }
      streamRef.current.onerror = () => {
        if (!isMounted.current) return
        setStreamStatus("error")
        setError("Camera streaming unavailable")
      }
    }
  }

  const stopStream = () => {
    if (streamInterval) {
      clearInterval(streamInterval)
      setStreamInterval(null)
    }

    if (streamRef.current) {
      streamRef.current.src = ""
    }

    setStreamStatus("inactive")
  }

  const toggleLiveStream = () => {
    if (showLiveStream) {
      stopStream()
      setShowLiveStream(false)
    } else {
      setShowLiveStream(true)
      startStream()
    }
  }

  const handleRefresh = () => {
    if (showLiveStream) {
      stopStream()
      startStream()
    } else {
      updateCameraFeed(cameraIP)
    }
  }

  const saveCameraSettings = () => {
    const firebase = initFirebase()
    if (!firebase?.database) return

    set(ref(firebase.database, "/settings/cameraIP"), tempIP)
      .then(() => {
        setCameraIP(tempIP)
        setShowSettings(false)
        if (showLiveStream) {
          stopStream()
          setShowLiveStream(false)
        }
        updateCameraFeed(tempIP)
      })
      .catch((err) => {
        console.error("Error saving camera IP:", err)
        setError("Failed to save camera settings")
      })
  }

  return (
    <div
      className={`bg-surface rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-muted text-muted-foreground flex items-center justify-center">
            <Camera size={16} />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Live Camera Feed
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {cameraIP ? `IP: ${cameraIP}` : "No camera IP"}
              </span>
              {showLiveStream && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive px-2 py-0.5 rounded-full bg-destructive/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            title="Camera Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Settings Modal Bar */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-surface-muted">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground">Configure ESP32 Camera</span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tempIP}
              onChange={(e) => setTempIP(e.target.value)}
              placeholder="e.g. 192.168.1.100"
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={saveCameraSettings}
              className="px-4 py-2 bg-accent text-accent-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Save IP
            </button>
          </div>
        </div>
      )}

      {/* Camera Video View Area */}
      <div className="p-5 flex flex-col flex-1 justify-center">
        <div className="relative aspect-video w-full bg-surface-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-accent mb-2" />
              <span className="text-xs text-muted-foreground">Connecting to camera...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-xs font-medium text-destructive mb-2">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-surface rounded-lg text-xs font-medium text-foreground border border-border hover:bg-surface-muted"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Snapshot image */}
              <img
                ref={snapshotRef}
                alt="Poultry camera snapshot"
                className={`w-full h-full object-cover ${showLiveStream ? "hidden" : "block"}`}
                crossOrigin="anonymous"
              />

              {/* Stream image */}
              <img
                ref={streamRef}
                alt="Poultry live camera stream"
                className={`w-full h-full object-cover ${showLiveStream ? "block" : "hidden"}`}
                crossOrigin="anonymous"
              />
            </>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-5 pt-0 border-t border-border mt-auto flex items-center justify-between gap-3">
        <button
          onClick={toggleLiveStream}
          disabled={!cameraIP || isLoading}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
            showLiveStream
              ? "bg-destructive text-destructive-foreground hover:opacity-90"
              : "bg-accent text-accent-foreground hover:opacity-90"
          }`}
        >
          {showLiveStream ? (
            <>
              <Square size={14} />
              <span>Stop Stream</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Start Live Stream</span>
            </>
          )}
        </button>

        <button
          onClick={() => updateCameraFeed(cameraIP)}
          disabled={!cameraIP || isLoading || showLiveStream}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium bg-surface-muted text-foreground hover:bg-border border border-border transition-colors disabled:opacity-50"
        >
          <Camera size={14} />
          <span>Snapshot</span>
        </button>
      </div>
    </div>
  )
}
