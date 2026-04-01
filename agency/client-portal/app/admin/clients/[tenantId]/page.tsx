import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getTenantFeatureFlags } from '@/lib/features';
import { FeatureFlagList } from './FeatureFlagToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { rootDomain } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

type PageProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  return {
    title: tenant ? `${tenant.name} — Feature Flags` : 'Client — Feature Flags',
    description: `Manage feature flags for ${tenant?.name ?? 'client'}`,
  };
}

export default async function ClientFeatureFlagsPage({ params }: PageProps) {
  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: { select: { users: true } },
    },
  });

  if (!tenant) {
    notFound();
  }

  const flags = await getTenantFeatureFlags(tenantId);

  // Summary counts
  const enabledCount = flags.filter((f) => f.enabled).length;
  const betaCount = flags.filter((f) => f.isBeta && f.enabled).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All clients
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Building2 className="h-4 w-4" />
              Client
            </div>
            <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tenant.domain}
              {tenant.subdomain && ` · ${tenant.subdomain}`}
            </p>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
              {enabledCount} enabled
            </span>
            {betaCount > 0 && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                {betaCount} beta
              </span>
            )}
          </div>
        </div>

        {/* Feature flags card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Feature Flags</CardTitle>
            <p className="text-sm text-muted-foreground">
              Toggle features on or off for this client. Changes take effect immediately.
            </p>
          </CardHeader>
          <CardContent>
            <FeatureFlagList flags={flags} tenantId={tenantId} />
          </CardContent>
        </Card>

        {/* Tenant details card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tenant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Slug</dt>
                <dd className="font-mono text-foreground mt-0.5">{tenant.slug}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Type</dt>
                <dd className="mt-0.5">{tenant.type}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Accent Color</dt>
                <dd className="mt-0.5 flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full border"
                    style={{ backgroundColor: tenant.accentColor }}
                  />
                  <code className="text-xs">{tenant.accentColor}</code>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Portal Users</dt>
                <dd className="mt-0.5">{tenant._count.users}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Sanity Dataset</dt>
                <dd className="font-mono text-foreground mt-0.5">{tenant.sanityDataset}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">CRM Site ID</dt>
                <dd className="font-mono text-foreground mt-0.5">
                  {tenant.crmSiteId ?? <span className="text-muted-foreground italic">Not linked</span>}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
