"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import LoadingAnimation from "@/components/loading-animation"
import ThemeToggle from "@/components/theme-toggle"
import { ThemeProvider } from "@/contexts/theme-context"
import { LogIn, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    setIsLoggingIn(true)

    try {
      const success = await login(username, password)
      if (success) {
        setTimeout(() => {
          router.push("/")
        }, 1500)
      } else {
        setError("Invalid username or password")
        setIsLoggingIn(false)
      }
    } catch (err) {
      setError("An error occurred during login")
      setIsLoggingIn(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      try {
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } catch (e) {
        console.error("Error accessing localStorage:", e)
      }
    }
  }, [mounted])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      {isLoggingIn && <LoadingAnimation />}

      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-green-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950" />

      {/* Decorative circle blurs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-copper/10 dark:bg-copper-light/5 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-sage/10 dark:bg-sage-light/5 blur-3xl" />
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-pond/5 dark:bg-pond-light/5 blur-3xl" />

      {/* Grain overlay */}
      <div className="absolute inset-0 grain-overlay" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      </div>

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 glass-card-elevated p-8 animate-fade-in-up"
      >
        {/* Brand section */}
        <div className="text-center mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-warm shadow-lg shadow-copper/20 mb-4">
            <span className="text-3xl">🐔</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Smart Poultry Farming</h1>
          <p className="text-sm text-muted-foreground mt-1">Login to access your farm dashboard</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-2 opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            <label htmlFor="username" className="block text-sm font-medium text-foreground">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-sm"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>

          {/* Password */}
          <div className="space-y-2 opacity-0 animate-fade-in-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-warm text-white font-heading font-semibold text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-copper/20"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 opacity-0 animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
          IoT-Based Smart Poultry Monitoring System
        </p>
      </div>
    </div>
  )
}
