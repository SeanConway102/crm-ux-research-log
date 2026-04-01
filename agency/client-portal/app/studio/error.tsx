/**
 * app/studio/error.tsx
 *
 * Error boundary for the /studio route segment (embedded Sanity Studio).
 * Catches errors when:
 *   - Sanity config is misconfigured or missing for the tenant
 *   - Sanity API is unreachable
 *   - Auth/session fails in the studio context
 *
 * This is separate from the portal error.tsx because the studio lives
 * outside the (portal) route group — it renders without the portal chrome.
 */

"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type StudioErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StudioError({ error, reset }: StudioErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[StudioError]", error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h1 className="text-xl font-semibold text-foreground mb-2">
        Content Editor unavailable
      </h1>

      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        {error.digest
          ? "The content editor encountered an unexpected error. Try refreshing, or return to your dashboard."
          : "The content editor could not be loaded. This may be a temporary issue."}
      </p>

      <div className="flex items-center gap-3">
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
  )
}
