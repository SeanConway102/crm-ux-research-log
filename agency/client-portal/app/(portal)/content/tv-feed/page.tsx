/**
 * TV Feed Management — Phase 5 (placeholder).
 *
 * This is a "Coming Soon" placeholder page for the TV Feed feature.
 * Clients can fill out a form to request TV Feed access — it submits
 * a support ticket tagged with `[TV Feed Request]`.
 *
 * The `tv_feed` feature flag gates access to this page.
 * If the flag is disabled, the user is redirected to /dashboard.
 *
 * Phase 6 (TV Feed management UI) will replace this placeholder
 * with a full editor for the satellite TV program feed.
 *
 * @see SPEC.md Phase 5 + Phase 6
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isFeatureEnabled } from "@/lib/features"
import { Radio } from "lucide-react"
import { TvFeedRequestForm } from "./tv-feed-form"

export const dynamic = "force-dynamic"

export default async function TvFeedPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // Phase 0 feature flag enforcement
  if (!(await isFeatureEnabled(session.user.tenantId, "tv_feed"))) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Radio className="h-4 w-4" />
          <span className="text-sm font-medium">Content</span>
        </div>
        <h1 className="text-2xl font-semibold">TV Feed</h1>
        <p className="text-muted-foreground mt-1">
          Manage your satellite TV program schedule and content feed.
        </p>
      </div>

      {/* Coming Soon placeholder */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Radio className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">TV Feed Management</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          The TV Feed management interface is coming soon. For now, fill out the
          form below and we&apos;ll get your feed configured.
        </p>

        {/* Request access form */}
        <TvFeedRequestForm />
      </div>
    </div>
  )
}
