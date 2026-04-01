"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type PortalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary for the portal route group.
 * Shown when an unhandled error occurs in any portal page.
 */
export default function PortalError({ error, reset }: PortalErrorProps) {
  useEffect(() => {
    // Log to console in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("[PortalError]", error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Something went wrong
      </h2>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.digest ? (
          <>An error occurred. Try refreshing the page, or contact support if the problem persists.</>
        ) : (
          <>An unexpected error occurred. Try refreshing the page.</>
        )}
      </p>

      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="default">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/dashboard")} variant="outline">
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
