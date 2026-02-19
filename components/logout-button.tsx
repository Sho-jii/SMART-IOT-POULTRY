"use client"

import { LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LogoutButton() {
  const { logout } = useAuth()

  return (
    <button onClick={logout} className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md">
      <LogOut size={16} className="mr-1" />
      Logout
    </button>
  )
}
