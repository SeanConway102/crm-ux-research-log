'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * global-error.tsx — Root-level error boundary for the entire app.
 *
 * Catches any error that:
 *  - Occurs in the root layout (`app/layout.tsx`)
 *  - Escapes all segment-level `error.tsx` boundaries
 *  - Is a server-side thrown error (redirect, notFound, etc.)
 *
 * Must be a client component and include <html>/<body> tags because it
 * replaces the root document shell when active.
 *
 * NOTE: While this is active, the root layout's HTML is not rendered.
 * Keep this UI minimal and resilient.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log full error in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError]', error)
    }
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong — CT Website Co.</title>
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
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
                    An unexpected error occurred. Your data is safe.{' '}
                    <span className="font-mono text-xs text-muted-foreground/60">
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
                onClick={() => { window.location.href = '/' }}
                variant="outline"
                size="sm"
              >
                Go to homepage
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
