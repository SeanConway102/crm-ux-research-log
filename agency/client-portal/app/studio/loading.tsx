/**
 * app/studio/loading.tsx
 *
 * Loading skeleton for the /studio route (embedded Sanity Studio).
 * Shown briefly while Next.js server renders the Studio page.
 *
 * Note: Sanity's embedded Studio also has its own loading state.
 * This route-level skeleton covers the initial client-side transition.
 */

import { Skeleton } from "@/components/ui/skeleton"

export default function StudioLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      {/* Logo area */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Main studio chrome skeleton */}
      <div className="w-full max-w-5xl px-4 space-y-4">
        {/* Top bar */}
        <Skeleton className="h-10 w-full rounded-lg" />

        {/* Desk layout */}
        <div className="flex gap-4">
          {/* Sidebar */}
          <Skeleton className="h-[60vh] w-56 rounded-lg shrink-0" />
          {/* Main content */}
          <Skeleton className="flex-1 h-[60vh] rounded-lg" />
        </div>
      </div>

      {/* Loading text */}
      <p className="mt-6 text-sm text-muted-foreground">
        Loading content editor…
      </p>
    </div>
  )
}
