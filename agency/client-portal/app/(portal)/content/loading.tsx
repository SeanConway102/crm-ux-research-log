/**
 * app/(portal)/content/loading.tsx
 *
 * Loading skeleton for the /content (Content Hub) page.
 * Shown while the page is being rendered server-side.
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function ContentTypeCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-3 w-full mt-1" />
        <Skeleton className="h-3 w-3/4 mt-0.5" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-7 w-32" />
      </CardContent>
    </Card>
  )
}

function TvFeedCardSkeleton() {
  return (
    <Card className="border-dashed opacity-60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        <Skeleton className="h-3 w-full mt-1" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-3 w-48" />
      </CardContent>
    </Card>
  )
}

export default function ContentLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Content type grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ContentTypeCardSkeleton />
        <ContentTypeCardSkeleton />
        <ContentTypeCardSkeleton />
        <TvFeedCardSkeleton />
      </div>

      {/* Studio shortcut banner */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-28" />
        </CardContent>
      </Card>
    </div>
  )
}
