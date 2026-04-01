"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type SupportErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary for the support tickets list route.
 * Shown when ticket list fetching fails.
 */
export default function SupportError({ error, reset }: SupportErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[SupportError]", error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Could not load tickets
      </h2>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.digest
          ? "An error occurred while loading your support tickets. Try refreshing."
          : "An unexpected error occurred."}
      </p>

      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="default" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/dashboard")} variant="outline" size="sm">
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
