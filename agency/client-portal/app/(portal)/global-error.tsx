'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PortalGlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * app/(portal)/global-error.tsx — Portal route group-level error boundary.
 *
 * Catches errors that occur within the portal route group (any page under
 * /dashboard, /studio, /support, /billing, /content, /settings).
 *
 * Unlike `app/error.tsx` (segment-level), this still renders inside the
 * portal shell (with sidebar/header) if the error occurs in a leaf page.
 * It does NOT replace the full HTML document.
 *
 * NOTE: `global-error.tsx` at ANY level REPLACES the root HTML document,
 * so this must also include <html>/<body> — but it can be portal-themed.
 */
export default function PortalGlobalError({ error, reset }: PortalGlobalErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PortalGlobalError]', error)
    }
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error — CT Website Co. Portal</title>
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Minimal portal shell — just enough context to feel like the app */}
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Error icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                {error.digest ? (
                  <>
                    An error occurred while loading this page. Your changes are safe.
                    <span className="mt-1 block font-mono text-xs text-muted-foreground/60">
                      Error ID: {error.digest}
                    </span>
                  </>
                ) : (
                  'An unexpected error occurred. Please try again.'
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={reset} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button
                onClick={() => { window.location.href = '/dashboard' }}
                variant="outline"
                size="sm"
              >
                Go to dashboard
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
