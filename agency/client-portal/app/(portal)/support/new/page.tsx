/**
 * File a new support ticket — Phase 0 (feature flag enforcement).
 *
 * This is a Server Component that:
 * 1. Requires authentication — redirects to /login if not logged in
 * 2. Enforces the "support" feature flag — redirects to /dashboard if disabled
 *    (prevents direct URL access to /support/new when the feature is disabled)
 *
 * The actual form is rendered by <NewTicketForm /> (a Client Component).
 *
 * @see SPEC.md Phase 0 §3.2.1 — "Enforce in middleware and page components"
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isFeatureEnabled } from "@/lib/features"
import { NewTicketForm } from "./new-ticket-form"

export default async function NewTicketPage() {
  const session = await auth()

  // 1. Require authentication
  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // 2. Phase 0 feature flag enforcement: redirect if "support" flag is disabled.
  // This handles direct URL access (e.g. bookmarked /support/new) that bypasses
  // the sidebar's client-side filtering of nav items.
  const supportEnabled = await isFeatureEnabled(session.user.tenantId, "support")
  if (!supportEnabled) {
    redirect("/dashboard")
  }

  return <NewTicketForm />
}
