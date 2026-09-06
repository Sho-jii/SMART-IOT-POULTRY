import {
  LayoutDashboard,
  Utensils,
  Droplets,
  CalendarClock,
  Clock,
  Sliders,
  Info,
  LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Food Analytics", href: "/feeding-analytics", icon: Utensils },
  { name: "Water Analytics", href: "/water-analytics", icon: Droplets },
  { name: "Feeding Schedule", href: "/feeding-schedule", icon: CalendarClock },
  { name: "Water Schedule", href: "/water-schedule", icon: Clock },
  { name: "Manual Controls", href: "/manual-controls", icon: Sliders },
  { name: "About", href: "/about", icon: Info },
]
