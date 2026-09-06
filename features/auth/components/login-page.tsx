"use client"

import ThemeToggle from "@/components/common/theme-toggle"
import { LoginForm } from "./login-form"

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-5 right-5">
        <ThemeToggle dropDirection="down" />
      </div>

      <LoginForm />
    </div>
  )
}
