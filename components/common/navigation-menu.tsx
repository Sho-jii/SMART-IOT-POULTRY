"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ThemeToggle from "./theme-toggle"
import { NAV_ITEMS } from "@/config/nav-items"
import {
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"

const SIDEBAR_EXPANDED = 240
const SIDEBAR_COLLAPSED = 72

export default function NavigationMenu() {
  const { logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Broadcast sidebar width as CSS variable so main content shifts smoothly
  useEffect(() => {
    const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`)
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width")
    }
  }, [collapsed])

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 bg-surface border-r border-border transition-all duration-200 ease-in-out ${collapsed ? "w-[72px]" : "w-[240px]"
          }`}
      >
        {/* Brand header */}
        <div
          className={`flex items-center px-5 h-16 border-b border-border ${collapsed ? "justify-center" : "gap-3"
            }`}
        >
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 font-bold text-sm">
            🐔
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-heading font-semibold text-sm leading-tight text-foreground">
                Smart Poultry
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Farm Management
              </p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center rounded-xl transition-colors duration-150 ${collapsed ? "justify-center p-3" : "px-3.5 py-2.5 gap-3"
                  } ${active
                    ? "bg-accent text-accent-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 ${active ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                />
                {!collapsed && <span className="text-sm truncate">{item.name}</span>}
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 pointer-events-none shadow-md">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-border space-y-1.5 bg-surface">
          {/* Theme toggle */}
          <div className={`flex items-center ${collapsed ? "justify-center" : "px-2"}`}>
            <ThemeToggle dropDirection="up" />
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className={`flex items-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full ${collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5 gap-3"
              }`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors w-full ${collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5 gap-3"
              }`}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ========== MOBILE TOP BAR ========== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-xs">
                🐔
              </div>
              <span className="font-heading font-semibold text-sm">Smart Poultry</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
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
          <div className="border-t border-border p-3 bg-surface space-y-1">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
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
