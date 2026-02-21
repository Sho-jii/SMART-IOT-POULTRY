"use client"

import { useEffect, useState, useRef } from "react"
import { ref, get, set } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Play, RefreshCw, Settings, X, Camera, Square } from "lucide-react"

interface CameraFeedProps {
  className?: string
}

export default function CameraFeed({ className = "" }: CameraFeedProps) {
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
    return () => { isMounted.current = false }
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
      .catch((error) => {
        if (!isMounted.current) return
        console.error("Error fetching camera IP:", error)
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

  const updateCameraFeed = (ip: string) => {
    if (!ip) return
    const timestamp = new Date().getTime()
    if (snapshotRef.current) {
      setError(null)
      snapshotRef.current.src = `http://${ip}/capture?t=${timestamp}`
      snapshotRef.current.onerror = () => {
        if (snapshotRef.current && isMounted.current) {
          snapshotRef.current.src = `http://${ip}/jpg?t=${timestamp}`
          snapshotRef.current.onerror = () => {
            if (isMounted.current) setError("Failed to connect to camera")
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
        if (streamRef.current && isMounted.current) {
          streamRef.current.src = `http://${cameraIP}:81/stream`
          streamRef.current.onerror = () => {
            if (!isMounted.current) return
            setupPseudoStream(streamFps)
          }
        }
      }
    }
  }

  const setupPseudoStream = (fps = 5) => {
    if (!cameraIP || !isMounted.current) return
    if (streamInterval) {
      clearInterval(streamInterval)
      setStreamInterval(null)
    }
    const intervalMs = 1000 / fps

    const tryEndpoints = async () => {
      if (!isMounted.current) return
      let workingEndpoint = ""

      try {
        const response = await fetch(`http://${cameraIP}/capture?t=${Date.now()}`)
        if (response.ok) workingEndpoint = `/capture`
      } catch (e) { /* silent */ }

      if (!isMounted.current) return

      if (!workingEndpoint) {
        try {
          const response = await fetch(`http://${cameraIP}/jpg?t=${Date.now()}`)
          if (response.ok) workingEndpoint = `/jpg`
        } catch (e) { /* silent */ }
      }

      if (!isMounted.current) return

      const endpoint = workingEndpoint || "/capture"

      if (streamRef.current && isMounted.current) {
        streamRef.current.src = `http://${cameraIP}${endpoint}?t=${Date.now()}`
        streamRef.current.onload = () => {
          if (isMounted.current) setStreamStatus("active")
        }
        streamRef.current.onerror = () => {
          if (isMounted.current) {
            setStreamStatus("error")
            setError("Failed to connect to camera")
          }
        }
      }

      const interval = setInterval(() => {
        if (streamRef.current && isMounted.current) {
          streamRef.current.src = `http://${cameraIP}${endpoint}?t=${Date.now()}`
        } else if (!isMounted.current) {
          clearInterval(interval)
        }
      }, intervalMs)

      if (isMounted.current) {
        setStreamInterval(interval)
      } else {
        clearInterval(interval)
      }
    }

    tryEndpoints()
  }

  const toggleLiveStream = () => {
    if (!showLiveStream) {
      setShowLiveStream(true)
      setTimeout(() => startStream(), 100)
    } else {
      stopStream()
    }
  }

  const stopStream = () => {
    if (streamRef.current) streamRef.current.src = ""
    if (streamInterval) {
      clearInterval(streamInterval)
      setStreamInterval(null)
    }
    setShowLiveStream(false)
    setStreamStatus("inactive")
  }

  const saveCameraIP = () => {
    if (!tempIP) return
    const firebase = initFirebase()
    if (!firebase?.database) return

    set(ref(firebase.database, "/settings/cameraIP"), tempIP)
      .then(() => {
        if (!isMounted.current) return
        setCameraIP(tempIP)
        updateCameraFeed(tempIP)
        setShowSettings(false)
        if (showLiveStream) {
          stopStream()
          setTimeout(() => {
            if (isMounted.current) {
              setShowLiveStream(true)
              startStream()
            }
          }, 500)
        }
      })
      .catch((error) => console.error("Error saving camera IP:", error))
  }

  const handleFpsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFps = parseInt(event.target.value, 10)
    setStreamFps(newFps)
    if (showLiveStream && streamStatus === "active") {
      setupPseudoStream(newFps)
    }
  }

  return (
    <div className={`sensor-card h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted-foreground/80 to-muted-foreground/50 flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">ESP32-CAM Feed</h2>
            <span className={`text-xs font-medium ${streamStatus === "active" ? "text-sage dark:text-sage-light" :
                streamStatus === "error" ? "text-destructive" :
                  "text-muted-foreground"
              }`}>
              {streamStatus === "active" ? "● Live" :
                streamStatus === "loading" ? "Connecting..." :
                  streamStatus === "error" ? "Error" :
                    "Standby"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            onClick={() => updateCameraFeed(cameraIP)}
            title="Refresh camera feed"
          >
            <RefreshCw size={16} />
          </button>
          <button
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            onClick={() => setShowSettings(!showSettings)}
            title="Camera settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-4 border-b border-border/50 bg-muted/30 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-sm font-medium text-foreground">Camera Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                ESP32-CAM IP Address
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={tempIP}
                  onChange={(e) => setTempIP(e.target.value)}
                  placeholder="e.g. 192.168.1.100"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-l-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                <button
                  onClick={saveCameraIP}
                  className="px-4 py-2 bg-gradient-warm text-white text-sm font-medium rounded-r-lg hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Without http:// or port
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Refresh Rate: {streamFps} FPS
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={streamFps}
                onChange={handleFpsChange}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex gap-2">
              <a
                href={cameraIP ? `http://${cameraIP}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 text-center px-3 py-2 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors ${!cameraIP && 'pointer-events-none opacity-50'}`}
              >
                Open Camera UI
              </a>
              <button
                onClick={() => {
                  if (cameraIP) window.open(`http://${cameraIP}/stream`, '_blank')
                }}
                className={`flex-1 text-center px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors ${!cameraIP && 'pointer-events-none opacity-50'}`}
              >
                Open Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed area */}
      <div className="p-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error && !showLiveStream ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Camera size={32} className="text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-destructive mb-3 font-medium">{error}</p>
            <button
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              onClick={() => setShowSettings(true)}
            >
              Configure Camera IP
            </button>
          </div>
        ) : (
          <>
            {!showLiveStream ? (
              <div className="relative w-full pt-[75%] bg-muted/30 rounded-lg overflow-hidden">
                <img
                  ref={snapshotRef}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  src="/api/placeholder/640/480"
                  alt="Camera Snapshot"
                  onError={() => {
                    if (isMounted.current) setError("Failed to connect to camera")
                  }}
                />
              </div>
            ) : (
              <div className="relative w-full pt-[75%] bg-muted/30 rounded-lg overflow-hidden">
                {streamStatus === "loading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 backdrop-blur-sm z-10">
                    <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {streamStatus === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 backdrop-blur-sm z-10">
                    <div className="text-center p-4">
                      <p className="font-heading font-semibold text-destructive mb-2">Connection Error</p>
                      <p className="text-sm text-white/70 mb-3">Failed to connect to camera stream</p>
                      <button
                        className="px-4 py-2 rounded-lg bg-primary/20 text-white text-sm font-medium hover:bg-primary/30 transition-colors"
                        onClick={() => startStream()}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
                <img
                  ref={streamRef}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  src="/api/placeholder/640/480"
                  alt="Live Stream"
                  onError={(e) => {
                    console.error("Stream error, may retry with different URL")
                  }}
                />
              </div>
            )}

            <div className="mt-3 flex justify-center gap-3">
              <button
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showLiveStream
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                onClick={toggleLiveStream}
              >
                {showLiveStream ? <Square size={14} /> : <Play size={14} />}
                {showLiveStream ? "Stop Stream" : "Start Live"}
              </button>

              {!showLiveStream && (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
                  onClick={() => updateCameraFeed(cameraIP)}
                >
                  <Camera size={14} />
                  Snapshot
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}