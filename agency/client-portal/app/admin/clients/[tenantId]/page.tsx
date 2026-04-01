import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFeatureFlags } from "@/lib/features"
import { FeatureFlagToggle } from "@/components/admin/feature-flag-toggle"
import { rootDomain } from "@/lib/utils"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ tenantId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantId } = await params
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  })
  return {
    title: `${tenant?.name ?? "Client"} — Feature Flags | ${rootDomain}`,
    description: `Manage feature flags for ${tenant?.name ?? "client"}`,
  }
}

export default async function ClientFeatureFlagsPage({ params }: Props) {
  const { tenantId } = await params

  // Auth check — only agency admins
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Access denied. Agency admin only.</p>
      </div>
    )
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, domain: true },
  })

  if (!tenant) notFound()

  const flags = await getTenantFeatureFlags(tenantId)

  const stableFlags = flags as Array<{
    key: string
    label: string
    description: string | null
    isBeta: boolean
    enabled: boolean
    overrideId: string | null
  }>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Clients
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{tenant.name}</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Tenant header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tenant.domain} &middot; {tenant.slug}
          </p>
        </div>

        {/* Feature flags */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-base font-semibold text-foreground">Feature Flags</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enable or disable features for this client. Changes take effect within the session refresh window (up to 1 hour for active users).
            </p>
          </div>

          <div className="px-6">
            {stableFlags.map((flag) => (
              <FeatureFlagToggle
                key={flag.key}
                flag={flag}
                tenantId={tenantId}
              />
            ))}
          </div>
        </div>

        {/* Beta notice */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Beta features are experimental and may change. Enable with caution.
        </p>
      </div>
    </div>
  )
}
