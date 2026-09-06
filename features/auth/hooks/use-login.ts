"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function useLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password")
      return
    }

    setIsLoggingIn(true)

    try {
      const success = await login(username, password)
      if (success) {
        setTimeout(() => {
          router.push("/")
        }, 500)
      } else {
        setError("Invalid username or password")
        setIsLoggingIn(false)
      }
    } catch (err) {
      setError("An error occurred during authentication")
      setIsLoggingIn(false)
    }
  }

  return {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    isLoggingIn,
    handleSubmit,
  }
}
