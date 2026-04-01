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
 *
 * NOTE: This route uses `export const dynamic = "force-static"` + a redirect
 * to avoid bundling next-sanity/studio at build time. next-sanity@12 requires
 * Next.js 16 (we run Next.js 15) — see Phase 2 blockers in SPEC.md.
 * The studio is feature-flagged so no production traffic hits this route.
 */

import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isFeatureEnabled } from "@/lib/features"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, ExternalLink } from "lucide-react"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth()
  if (!session?.user?.tenantId) return { title: "Content Editor" }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true },
  })
  if (!tenant) return { title: "Content Editor" }

  return { title: `${tenant.name} — Content Editor` }
}

// Skip building this route at compile time (next-sanity@12 requires Next.js 16)
export const dynamic = "force-dynamic"
export const dynamicBlades_errorType = "blade-skip"

export default async function StudioPage() {
  const session = await auth()

  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  // Phase 0 feature flag enforcement
  const studioEnabled = await isFeatureEnabled(session.user.tenantId, "studio")
  if (!studioEnabled) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    })
    redirect(`/${tenant?.slug ?? ""}/dashboard`)
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true, name: true },
  })
  if (!tenant) redirect("/login")

  // Try to render the actual embedded studio (Node.js runtime only)
  // If next-sanity is incompatible, the try/catch handles it gracefully
  try {
    const { buildSanityConfig } = await import("@/lib/sanity-config-factory")
    const config = await buildSanityConfig(tenant.slug)
    if (config) {
      // Dynamic import of NextStudio to avoid webpack bundling it at build time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { NextStudio } = await import("next-sanity/studio") as any
      return <NextStudio config={config} />
    }
  } catch {
    // Fall through to the stub below
  }

  // Stub: shown when next-sanity is not available (e.g. Next.js version mismatch)
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Content Editor</CardTitle>
          </div>
          <CardDescription>
            The embedded content editor requires Next.js 16 to run.
            This instance is currently on Next.js 15.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your site&apos;s content is managed in Sanity. Contact your agency
            administrator to access the editor, or visit your Sanity project directly.
          </p>
          <Button asChild variant="outline" className="w-full">
            <a href="https://sanity.io/manage" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Sanity Manage
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
