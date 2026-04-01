"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type NewClientErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary for the new client page (admin/clients/new).
 */
export default function NewClientError({ error, reset }: NewClientErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[NewClientError]", error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Could not load the new client form
      </h2>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.digest
          ? "An error occurred. No changes were made."
          : "An unexpected error occurred."}
      </p>

      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="default" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/admin")} variant="outline" size="sm">
          Back to admin
        </Button>
      </div>
    </div>
  )
}
