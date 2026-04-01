/**
 * app/(portal)/settings/error.tsx
 *
 * Error boundary for the /settings route segment.
 * Catches uncaught exceptions from the settings page and its child components.
 */

"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type SettingsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SettingsError({ error, reset }: SettingsErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[SettingsError]", error)
    }
  }, [error])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <span className="text-sm font-medium">Account</span>
        </div>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      {/* Error state */}
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="text-base font-semibold mb-1">Unable to load settings</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          {error.digest
            ? "An unexpected error occurred. Your changes may not have been saved."
            : "An error occurred while loading your settings."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            variant="outline"
            size="sm"
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
