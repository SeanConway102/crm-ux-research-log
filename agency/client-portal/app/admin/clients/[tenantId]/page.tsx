import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getTenantFeatureFlags, FEATURE_FLAGS, type FeatureKey } from "@/lib/features"
import { FeatureFlagToggles } from "./feature-flag-toggles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, Globe, Mail } from "lucide-react"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ tenantId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantId } = await params
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  return {
    title: tenant ? `${tenant.name} — Feature Flags` : "Client Not Found",
  }
}

export default async function ClientDetailPage({ params }: Props) {
  const { tenantId } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        select: { email: true, name: true, role: true },
        take: 5,
      },
    },
  })

  if (!tenant) notFound()

  const featureFlags = await getTenantFeatureFlags(tenantId)

  const flagCount = featureFlags.filter((f) => f.enabled).length
  const betaCount = featureFlags.filter((f) => f.isBeta && f.enabled).length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex h-9 items-center gap-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Clients
          </Link>
        </div>

        {/* Tenant Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-xl">{tenant.name}</CardTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Globe className="h-3.5 w-3.5" />
                      {tenant.domain}
                    </span>
                    {tenant.subdomain && (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        {tenant.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant={tenant.type === "AGENCY" ? "default" : "secondary"}>
                {tenant.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Slug</p>
              <p className="font-mono text-gray-900">{tenant.slug}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Branding Color</p>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded border"
                  style={{ backgroundColor: tenant.accentColor }}
                />
                <span className="font-mono text-gray-900">{tenant.accentColor}</span>
              </div>
            </div>
            {tenant.crmSiteId && (
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">CRM Site ID</p>
                <p className="font-mono text-gray-900 text-xs">{tenant.crmSiteId}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Features Enabled</p>
              <p className="font-semibold text-gray-900">
                {flagCount} / {featureFlags.length}
                {betaCount > 0 && (
                  <span className="ml-2 text-amber-600 font-normal">
                    ({betaCount} beta)
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Flags</CardTitle>
            <p className="text-sm text-gray-500">
              Enable or disable features for this client. Changes take effect within 60 seconds.
            </p>
          </CardHeader>
          <CardContent>
            <FeatureFlagToggles
              tenantId={tenantId}
              featureFlags={featureFlags}
            />
          </CardContent>
        </Card>

        {/* Users */}
        {tenant.users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tenant.users.map((user) => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {user.name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name ?? "—"}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
