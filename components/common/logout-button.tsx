"use client"

import { LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const { logout } = useAuth()

  return (
    <button
      onClick={logout}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors ${className}`}
    >
      <LogOut size={16} />
      <span>Logout</span>
    </button>
  )
}
