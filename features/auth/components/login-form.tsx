"use client"

import { useLogin } from "../hooks/use-login"
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react"

export function LoginForm() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    isLoggingIn,
    handleSubmit,
  } = useLogin()

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-surface border border-border shadow-sm">
      {/* Brand & Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 text-accent mb-4 text-2xl">
          🐔
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
          Smart Poultry Farm
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sign in to access your IoT farm management dashboard
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-xs font-medium text-foreground mb-1.5">
            Operator Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoggingIn}
            placeholder="admin"
            className="w-full h-10 px-3.5 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-foreground mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
              placeholder="••••••••"
              className="w-full h-10 px-3.5 pr-10 text-xs rounded-xl bg-surface border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-10 rounded-xl bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <>
                <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <LogIn size={15} />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border text-center">
        <p className="text-[11px] text-muted-foreground">
          Smart IoT Poultry Automation System • Single Operator Node
        </p>
      </div>
    </div>
  )
}
