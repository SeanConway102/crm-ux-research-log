/**
 * app/(portal)/settings/loading.tsx
 *
 * Loading skeleton for the /settings page.
 * Shown while the settings page is being rendered server-side.
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function ProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-48 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name field */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        {/* Email field */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        {/* Submit button */}
        <Skeleton className="h-8 w-28" />
      </CardContent>
    </Card>
  )
}

function SecurityCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 w-64 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current password */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        {/* New password */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        {/* Confirm password */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        {/* Submit button */}
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  )
}

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-xl">
      {/* Page header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Profile card */}
      <ProfileCardSkeleton />

      {/* Separator */}
      <Skeleton className="h-px w-full" />

      {/* Security card */}
      <SecurityCardSkeleton />
    </div>
  )
}
