/**
 * app/(portal)/support/[id]/loading.tsx
 *
 * Loading state shown while the ticket detail page is being streamed.
 * Mirrors the ticket detail page structure: back link, header, description card,
 * comment thread skeleton, and reply composer skeleton.
 */

import { Skeleton } from "@/components/ui/skeleton"

export default function TicketDetailLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-96" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Description card */}
      <div className="rounded-lg border bg-surface">
        <div className="px-6 py-4 border-b">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      {/* Comment count */}
      <Skeleton className="h-5 w-28" />

      {/* Comments skeleton */}
      <div className="rounded-lg border bg-surface">
        <div className="p-6 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply composer skeleton */}
      <div className="rounded-lg border bg-surface p-4 space-y-3">
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  )
}
