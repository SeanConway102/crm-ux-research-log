/**
 * Embedded Sanity Studio — Phase 2.
 *
 * This route is outside the `(portal)` route group so the portal sidebar/header
 * chrome does NOT wrap the Studio (Sanity provides its own chrome).
 *
 * Auth: middleware.ts already guards this route — only EDITOR and OWNER roles
 * pass through. Unauthorized users are redirected to the dashboard.
 *
 * Multi-tenancy: config is built per-request (force-dynamic) from the
 * tenant's CRM site record so each client portal renders their own
 * Sanity project's Studio.
 *
 * @see /lib/sanity-config-factory.ts
 * @see SPEC.md Phase 2
 */

import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { buildSanityConfig } from "@/lib/sanity-config-factory"
import { NextStudio } from "next-sanity/studio"
import { metadata, viewport } from "next-sanity/studio"
import type { Metadata, Viewport } from "next"

// Re-export Studio's default metadata (noindex, mobile viewport)
export { metadata, viewport }

export const dynamic = "force-dynamic"

export default async function StudioPage() {
  const session = await auth()

  // Defensive: middleware should have already redirected unauthenticated users,
  // but we check again in case this route is called directly.
  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // Build the per-tenant config — returns null if Sanity is not configured
  // (e.g. tenant hasn't been provisioned with a CRM site yet).
  const config = await buildSanityConfig(session.user.tenantId)

  if (!config) {
    notFound()
  }

  // NextStudio is a Client Component (has "use client" inside its module graph).
  // Passing the config as a serializable prop from this Server Component is the
  // intended pattern for dynamic multi-tenant configs.
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <NextStudio config={config as any}
      // Themed to match the portal — uses Sanity's CSS variable injection.
      // To fully customise, wrap with <StudioProvider> and pass children:
      //   <NextStudio config={config}>
      //     <StudioProvider config={config}>
      //       <StudioLayout />
      //     </StudioProvider>
      //   </NextStudio>
    />
  )
}
