"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ThemeToggle from "@/components/theme-toggle"
import {
  Home,
  Utensils,
  Droplet,
  Clock,
  Menu,
  X,
  LogOut,
  Info,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const SIDEBAR_EXPANDED = 240
const SIDEBAR_COLLAPSED = 72

export default function NavigationMenu() {
  const { logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Broadcast sidebar width as CSS variable so every page can read it
  useEffect(() => {
    const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`)
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width")
    }
  }, [collapsed])

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Food Analytics", href: "/feeding-analytics", icon: Utensils },
    { name: "Water Analytics", href: "/water-analytics", icon: Droplet },
    { name: "Feeding Schedule", href: "/feeding-schedule", icon: Clock },
    { name: "Water Schedule", href: "/water-schedule", icon: Clock },
    { name: "Manual Controls", href: "/manual-controls", icon: Sliders },
    { name: "About", href: "/about", icon: Info },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 glass-card border-r border-border/50 transition-all duration-300 ease-in-out ${collapsed ? "w-[72px]" : "w-[240px]"
          }`}
        style={{ borderRadius: 0 }}
      >
        {/* Brand header */}
        <div className={`flex items-center px-4 h-16 border-b border-border/50 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-9 h-9 rounded-lg bg-gradient-warm flex items-center justify-center flex-shrink-0">
            <span className="text-white font-heading font-bold text-sm">🐔</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="font-heading font-bold text-sm leading-tight text-foreground">Smart Poultry</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Farm Dashboard</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center rounded-lg transition-all duration-200 ${collapsed ? "justify-center p-3" : "px-3 py-2.5 gap-3"
                  } ${active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator line */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                )}
                <Icon size={20} className={`flex-shrink-0 transition-colors ${active ? "text-primary" : ""}`} />
                {!collapsed && (
                  <span className="text-sm truncate animate-fade-in">{item.name}</span>
                )}
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 border-t border-border/50 space-y-2">
          {/* Theme toggle — opens upward in sidebar */}
          <div className={`flex items-center ${collapsed ? "justify-center" : "px-3"}`}>
            <ThemeToggle dropDirection="up" />
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className={`flex items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full ${collapsed ? "justify-center p-3" : "px-3 py-2.5 gap-3"
              }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 w-full ${collapsed ? "justify-center p-3" : "px-3 py-2.5 gap-3"
              }`}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ========== MOBILE TOP BAR ========== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-card border-b border-border/50" style={{ borderRadius: 0 }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-warm flex items-center justify-center">
                <span className="text-white text-xs">🐔</span>
              </div>
              <span className="font-heading font-semibold text-sm">Smart Poultry</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle dropDirection="down" />
            <button
              onClick={logout}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-border/50 p-3 animate-fade-in-up">
            <nav className="space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />
    </>
  )
}
