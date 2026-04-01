/**
 * app/(portal)/support/new/loading.tsx
 *
 * Loading state shown while the new ticket form is being streamed.
 * Matches the form structure: heading + card with form fields.
 */

import { Skeleton } from "@/components/ui/skeleton"

export default function NewTicketLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Page heading */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Form card */}
      <div className="rounded-lg border bg-surface p-6 space-y-5">
        {/* Subject field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Priority field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  )
}
