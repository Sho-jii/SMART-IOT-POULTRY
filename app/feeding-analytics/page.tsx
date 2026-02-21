"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import LoadingAnimation from "@/components/loading-animation"
import FeedingAnalytics from "@/components/feeding-analytics"
import FeedingControl from "@/components/feeding-control"
import NavigationMenu from "@/components/navigation-menu"

export default function FeedingAnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [isAuthenticated, authLoading])

  if (authLoading || isLoading) {
    return <LoadingAnimation />
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <NavigationMenu />

      <main className="sidebar-content transition-all duration-300">
        <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
          <header className="mb-8 animate-fade-in-up">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Feeding Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor feed consumption and manage feeding schedules</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
              <FeedingControl />
            </div>
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
              <FeedingAnalytics />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
