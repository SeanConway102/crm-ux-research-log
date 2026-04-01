/**
 * app/(portal)/content/error.tsx
 *
 * Error boundary for the /content route segment.
 * Catches uncaught exceptions from the content hub page and child routes.
 */

"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type ContentErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ContentError({ error, reset }: ContentErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ContentError]", error)
    }
  }, [error])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Content</h1>
      </div>

      {/* Error state */}
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="text-base font-semibold mb-1">Unable to load content</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          {error.digest
            ? "An unexpected error occurred while loading your content."
            : "Something went wrong loading the content hub."}
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
