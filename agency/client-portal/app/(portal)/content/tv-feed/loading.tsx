/**
 * app/(portal)/content/tv-feed/loading.tsx
 *
 * Loading skeleton shown while the TV Feed page is streaming in.
 * Mirrors the page's visual structure: header area + dashed placeholder card.
 *
 * @see app/(portal)/content/tv-feed/page.tsx
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Radio } from "lucide-react"

export default function TvFeedLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div>
        {/* Breadcrumb row */}
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Title */}
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Dashed placeholder card */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8">
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Radio className="h-6 w-6 text-primary" />
          </div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Form skeleton */}
        <div className="max-w-xl mx-auto space-y-4">
          {/* Feed name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Feed URL */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Feed format (select) */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
