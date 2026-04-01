/**
 * Embedded Sanity Studio — Phase 2 + 2b + Phase 0 (feature flag enforcement).
 *
 * This route is outside the `(portal)` route group so the portal sidebar/header
 * chrome does NOT wrap the Studio (Sanity provides its own chrome).
 *
 * Auth: middleware.ts already guards this route — only EDITOR and OWNER roles
 * pass through. Unauthorized users are redirected to the dashboard.
 *
 * Feature flags (Phase 0): The "studio" feature flag must be enabled for the
 * tenant. If disabled, the user is redirected to the dashboard. This check lives
 * here (Server Component, Node.js runtime) because middleware cannot use Prisma
 * on Edge Runtime.
 *
 * Multi-tenancy: config is built per-request (force-dynamic) from the
 * tenant's CRM site record so each client portal renders their own
 * Sanity project's Studio.
 *
 * Phase 2b: config now includes structureTool (desk layout) and visionTool
 * (GROQ playground), plus a per-tenant title.
 *
 * @see /lib/sanity-config-factory.ts
 * @see SPEC.md Phase 2 + 2b
 */

import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { buildSanityConfig } from "@/lib/sanity-config-factory"
import { NextStudio } from "next-sanity/studio"
import { metadata as studioMetadata, viewport } from "next-sanity/studio"
import { isFeatureEnabled } from "@/lib/features"
import { prisma } from "@/lib/prisma"
import type { Metadata, Viewport } from "next"

// Re-export Studio's default viewport (noindex, mobile viewport)
export { viewport }

// Dynamic metadata — per-tenant page title in browser tab
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth()
  if (!session?.user?.tenantId) return {}

  const config = await buildSanityConfig(session.user.tenantId)
  const title = config?.title ?? "Content Editor"

  return {
    title: {
      absolute: title,
    },
  }
}

export const dynamic = "force-dynamic"

export default async function StudioPage() {
  const session = await auth()

  // Defensive: middleware should have already redirected unauthenticated users,
  // but we check again in case this route is called directly.
  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // Phase 0 feature flag enforcement: redirect if studio is not enabled for this tenant.
  // Middleware cannot check Prisma (Edge Runtime), so we check here (Node.js runtime).
  const studioEnabled = await isFeatureEnabled(session.user.tenantId, "studio")
  if (!studioEnabled) {
    // Look up tenant slug for the redirect URL
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    })
    redirect(`/${tenant?.slug ?? ""}/dashboard`)
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
  //
  // The config now includes:
  //   title: "Acme Corp — Content Editor"      (Phase 2b: per-tenant)
  //   plugins: [structureTool, visionTool]      (Phase 2b: tools enabled)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <NextStudio config={config as any} />
}
