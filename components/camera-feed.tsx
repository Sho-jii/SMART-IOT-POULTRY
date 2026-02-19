"use client"

import { useEffect, useState, useRef } from "react"
import { ref, get, set } from "firebase/database"
import { initFirebase } from "@/lib/firebase"
import { Play, RefreshCw, Settings, X } from "lucide-react"

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
  
  // Track whether component is mounted
  const isMounted = useRef(true)

  // Set up mounted tracker
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Load camera IP from Firebase
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

  // Clean up interval and stream when component unmounts
  useEffect(() => {
    return () => {
      // Clear interval if it exists
      if (streamInterval) {
        clearInterval(streamInterval)
      }
      
      // Clear stream source
      if (streamRef.current) {
        streamRef.current.src = ""
      }
      
      // Reset stream status
      setStreamStatus("inactive")
    }
  }, [streamInterval])

  // Update camera feed with the given IP
  const updateCameraFeed = (ip: string) => {
    if (!ip) return

    const timestamp = new Date().getTime() // Add timestamp to prevent caching

    if (snapshotRef.current) {
      // Reset any previous error state
      setError(null)
      
      // Try the standard capture endpoint
      snapshotRef.current.src = `http://${ip}/capture?t=${timestamp}`
      
      snapshotRef.current.onerror = () => {
        // If the standard endpoint fails, try the jpg endpoint which some ESP32-CAM firmwares use
        if (snapshotRef.current && isMounted.current) {
          snapshotRef.current.src = `http://${ip}/jpg?t=${timestamp}`
          
          snapshotRef.current.onerror = () => {
            if (isMounted.current) {
              setError("Failed to connect to camera")
            }
          }
        }
      }
      
      snapshotRef.current.onload = () => {
        if (isMounted.current) {
          setError(null)
        }
      }
    }
  }

  // Set up streaming with MJPEG stream if supported
  const startStream = () => {
    if (!cameraIP || !isMounted.current) return
    
    // Reset error and set status to loading
    setError(null)
    setStreamStatus("loading")
    
    if (streamRef.current) {
      // Clear any existing stream first
      streamRef.current.src = ""
      
      // Try the standard ESP32-CAM streaming endpoint
      streamRef.current.src = `http://${cameraIP}/stream`
      
      // Set a timeout to fall back to pseudo-streaming if the MJPEG stream doesn't load
      const timeoutId = setTimeout(() => {
        if (!isMounted.current) return
        
        console.log("MJPEG stream timeout, falling back to pseudo-streaming")
        
        // Try alternative endpoints before giving up
        if (streamRef.current && isMounted.current) {
          streamRef.current.src = `http://${cameraIP}:81/stream`
          
          const secondTimeoutId = setTimeout(() => {
            if (!isMounted.current) return
            
            console.log("Alternative stream timeout, using pseudo-streaming")
            setupPseudoStream(streamFps)
          }, 2000)
          
          // If second attempt loads successfully, clear the timeout
          streamRef.current.onload = () => {
            clearTimeout(secondTimeoutId)
            if (isMounted.current) {
              setStreamStatus("active")
            }
          }
        }
        // If second attempt fails, setupPseudoStream will be called by the timeout
      }, 2000)
      
      // If image loads successfully on first attempt, clear the timeout
      streamRef.current.onload = () => {
        clearTimeout(timeoutId)
        if (isMounted.current) {
          setStreamStatus("active")
        }
      }
      
      // If error occurs with first attempt, try alternative URL
      streamRef.current.onerror = () => {
        if (!isMounted.current) return
        
        console.log("Stream error on first URL, trying alternative")
        if (streamRef.current && isMounted.current) {
          streamRef.current.src = `http://${cameraIP}:81/stream`
          
          // Set up error handler for second attempt
          streamRef.current.onerror = () => {
            if (!isMounted.current) return
            
            console.log("Stream error on second URL, using pseudo-streaming")
            setupPseudoStream(streamFps)
          }
        }
      }
    }
  }

  // Set up pseudo-streaming as fallback
  const setupPseudoStream = (fps = 5) => {
    if (!cameraIP || !isMounted.current) return

    // Clear any existing interval
    if (streamInterval) {
      clearInterval(streamInterval)
      setStreamInterval(null)
    }

    const intervalMs = 1000 / fps
    
    // Try to determine which endpoint works
    const tryEndpoints = async () => {
      if (!isMounted.current) return
      
      let workingEndpoint = "";
      
      // Try the standard capture endpoint
      try {
        const response = await fetch(`http://${cameraIP}/capture?t=${Date.now()}`);
        if (response.ok) {
          workingEndpoint = `/capture`;
        }
      } catch (e) {
        console.log("Standard capture endpoint failed");
      }
      
      // If component unmounted during async operation, abort
      if (!isMounted.current) return
      
      // If standard endpoint failed, try jpg endpoint
      if (!workingEndpoint) {
        try {
          const response = await fetch(`http://${cameraIP}/jpg?t=${Date.now()}`);
          if (response.ok) {
            workingEndpoint = `/jpg`;
          }
        } catch (e) {
          console.log("JPG endpoint failed");
        }
      }
      
      // If component unmounted during async operation, abort
      if (!isMounted.current) return
      
      // Use the working endpoint or default to /capture
      const endpoint = workingEndpoint || "/capture";
      console.log(`Using endpoint: ${endpoint} for pseudo-streaming`);
      
      // Set initial image
      if (streamRef.current && isMounted.current) {
        streamRef.current.src = `http://${cameraIP}${endpoint}?t=${Date.now()}`;
        
        // Set up onload handler for initial image
        streamRef.current.onload = () => {
          if (isMounted.current) {
            setStreamStatus("active")
          }
        }
        
        // Set up onerror handler for initial image
        streamRef.current.onerror = () => {
          if (isMounted.current) {
            setStreamStatus("error")
            setError("Failed to connect to camera")
          }
        }
      }
      
      // Set up interval to refresh the image
      const interval = setInterval(() => {
        if (streamRef.current && isMounted.current) {
          streamRef.current.src = `http://${cameraIP}${endpoint}?t=${Date.now()}`;
        } else if (!isMounted.current) {
          // If component unmounted, clear the interval
          clearInterval(interval)
        }
      }, intervalMs);
      
      if (isMounted.current) {
        setStreamInterval(interval);
      } else {
        clearInterval(interval)
      }
    };
    
    tryEndpoints();
  }

  // Toggle live stream view
  const toggleLiveStream = () => {
    if (!showLiveStream) {
      // Start streaming
      setShowLiveStream(true)
      setTimeout(() => {
        startStream()
      }, 100)
    } else {
      // Stop streaming
      stopStream()
    }
  }
  
  // Stop the stream completely
  const stopStream = () => {
    // Clear the stream source
    if (streamRef.current) {
      streamRef.current.src = "";
    }
    
    // Clear any interval
    if (streamInterval) {
      clearInterval(streamInterval)
      setStreamInterval(null)
    }
    
    // Update state
    setShowLiveStream(false)
    setStreamStatus("inactive")
  }

  // Save camera IP to Firebase
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
        
        // If streaming was active, restart it with new IP
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
      .catch((error) => {
        console.error("Error saving camera IP:", error)
      })
  }

  // Handle FPS change
  const handleFpsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFps = parseInt(event.target.value, 10)
    setStreamFps(newFps)
    
    // If streaming is active, update the stream with new FPS
    if (showLiveStream && streamStatus === "active") {
      setupPseudoStream(newFps)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-gray-700 text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 mr-2"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          ESP32-CAM Feed
        </h2>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
            onClick={() => updateCameraFeed(cameraIP)}
            title="Refresh camera feed"
          >
            <RefreshCw size={16} />
          </button>
          <button
            className="p-2 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
            onClick={() => setShowSettings(!showSettings)}
            title="Camera settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Camera Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ESP32-CAM IP Address
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={tempIP}
                  onChange={(e) => setTempIP(e.target.value)}
                  placeholder="e.g. 192.168.1.100"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={saveCameraIP}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Example: 192.168.1.123 (without http:// or port)
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refresh Rate (FPS): {streamFps}
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={streamFps}
                onChange={handleFpsChange}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <a 
                  href={cameraIP ? `http://${cameraIP}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`bg-gray-500 text-white px-3 py-2 rounded text-center text-sm flex-1 hover:bg-gray-600 ${!cameraIP && 'pointer-events-none opacity-50'}`}
                >
                  Open Camera UI
                </a>
                
                <button
                  onClick={() => {
                    if (cameraIP) {
                      // Try both endpoints to see what works
                      window.open(`http://${cameraIP}/capture`, '_blank');
                      window.open(`http://${cameraIP}/jpg`, '_blank');
                    }
                  }}
                  className={`bg-gray-500 text-white px-3 py-2 rounded text-center text-sm flex-1 hover:bg-gray-600 ${!cameraIP && 'pointer-events-none opacity-50'}`}
                >
                  Test Images
                </button>
              </div>
              
              <button
                onClick={() => {
                  if (cameraIP) {
                    window.open(`http://${cameraIP}/stream`, '_blank');
                  }
                }}
                className={`bg-blue-500 text-white px-3 py-2 rounded text-center text-sm hover:bg-blue-600 ${!cameraIP && 'pointer-events-none opacity-50'}`}
              >
                Open Stream in New Tab
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error && !showLiveStream ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              onClick={() => setShowSettings(true)}
            >
              Configure Camera IP
            </button>
          </div>
        ) : (
          <>
            {!showLiveStream ? (
              <div className="relative w-full pt-[75%] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  ref={snapshotRef}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  src="/api/placeholder/640/480"
                  alt="Camera Snapshot"
                  onError={() => {
                    if (isMounted.current) {
                      setError("Failed to connect to camera")
                    }
                  }}
                />
              </div>
            ) : (
              <div className="relative w-full pt-[75%] bg-gray-100 rounded-lg overflow-hidden">
                {streamStatus === "loading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {streamStatus === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                    <div className="text-white text-center p-4">
                      <p className="font-bold text-red-400 mb-2">Connection Error</p>
                      <p>Failed to connect to camera stream</p>
                      <button 
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
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
                    // Don't show error message as this can fire during stream switching
                    console.error("Stream error, may retry with different URL");
                  }}
                />
              </div>
            )}

            <div className="mt-4 flex justify-center space-x-4">
              <button
                className={`${
                  showLiveStream 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white px-4 py-2 rounded-lg flex items-center`}
                onClick={toggleLiveStream}
              >
                <Play className="mr-2" size={16} />
                {showLiveStream ? "Stop Stream" : "Start Live Stream"}
              </button>
              
              {!showLiveStream && (
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => updateCameraFeed(cameraIP)}
                >
                  Take Snapshot
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}