"use client"

import { useState, useEffect, useRef } from "react"
import { Moon, Sun, Clock, Monitor } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

type ThemeMode = "auto" | "manual"

interface ThemeToggleProps {
  dropDirection?: "up" | "down"
}

export default function ThemeToggle({ dropDirection = "down" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [contextError, setContextError] = useState(false)
  const [localTheme, setLocalTheme] = useState("light")
  const [localThemeMode, setLocalThemeMode] = useState<ThemeMode>("auto")
  const dropdownRef = useRef<HTMLDivElement>(null)

  let themeContext
  try {
    themeContext = useTheme()
  } catch (error) {
    if (!contextError) {
      console.error("Theme context error:", error)
      setContextError(true)
    }
    themeContext = null
  }

  let theme = localTheme
  let themeMode = localThemeMode
  let toggleTheme = () => {
    const newTheme = localTheme === "light" ? "dark" : "light"
    setLocalTheme(newTheme)
    if (typeof window !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      try {
        localStorage.setItem("theme", newTheme)
        localStorage.setItem("themeMode", "manual")
      } catch (e) {
        console.error("localStorage error:", e)
      }
    }
  }

  let setThemeMode = (mode: ThemeMode) => {
    setLocalThemeMode(mode)
    try {
      localStorage.setItem("themeMode", mode)
    } catch (e) {
      console.error("localStorage error:", e)
    }
  }

  if (themeContext) {
    theme = themeContext.theme
    themeMode = themeContext.themeMode
    toggleTheme = themeContext.toggleTheme
    setThemeMode = themeContext.setThemeMode
  }

  useEffect(() => {
    setMounted(true)

    if (contextError && typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("theme")
        const savedMode = localStorage.getItem("themeMode") as ThemeMode | null

        if (savedTheme) setLocalTheme(savedTheme)
        if (savedMode) setLocalThemeMode(savedMode)

        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e)
      }
    }
  }, [contextError])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowOptions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!mounted) {
    return null
  }

  const handleToggleClick = () => {
    toggleTheme()
  }

  const handleModeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
    setShowOptions(false)
  }

  // Dynamic positioning classes based on drop direction
  const dropdownPositionClass =
    dropDirection === "up"
      ? "bottom-full mb-2 left-0"
      : "top-full mt-2 right-0"

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {showOptions && (
        <div className={`absolute ${dropdownPositionClass} w-48 glass-card-elevated py-1.5 z-50 animate-fade-in`}>
          <button
            onClick={handleToggleClick}
            className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
          >
            {theme === "light" ? (
              <>
                <Moon size={15} className="mr-2.5 text-muted-foreground" />
                Switch to Dark
              </>
            ) : (
              <>
                <Sun size={15} className="mr-2.5 text-muted-foreground" />
                Switch to Light
              </>
            )}
          </button>

          <div className="border-t border-border/50 my-1" />

          <button
            onClick={() => handleModeChange("auto")}
            className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${themeMode === "auto" ? "text-primary font-medium" : "text-foreground"
              } hover:bg-muted/60`}
          >
            <Clock size={15} className="mr-2.5 text-muted-foreground" />
            Auto Mode
            {themeMode === "auto" && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>

          <button
            onClick={() => handleModeChange("manual")}
            className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${themeMode === "manual" ? "text-primary font-medium" : "text-foreground"
              } hover:bg-muted/60`}
          >
            <Monitor size={15} className="mr-2.5 text-muted-foreground" />
            Manual
            {themeMode === "manual" && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
