import { getAllSubdomains } from '@/lib/subdomains';
import type { Metadata } from 'next';
import { AdminDashboard } from './dashboard';
import { rootDomain } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: `Admin Dashboard | ${rootDomain}`,
  description: `Manage subdomains for ${rootDomain}`
};

export default async function AdminPage() {
  // Fetch subdomains from Redis (the existing subdomain management system)
  const subdomains = await getAllSubdomains()

  // Also fetch all CLIENT-type tenants from Prisma (for feature flag management)
  // We need the tenant ID to link to the detail page
  const prismaTenants = await prisma.tenant.findMany({
    where: { type: "CLIENT" },
    select: { id: true, slug: true, name: true, subdomain: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Build a map of slug → tenant id for linking
  const tenantSlugToId = Object.fromEntries(
    prismaTenants.map((t) => [t.slug, t.id])
  )

  // Merge: subdomains that have a Prisma tenant get a tenantId
  const tenants = subdomains.map((sd) => ({
    ...sd,
    tenantId: tenantSlugToId[sd.subdomain] ?? null,
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <AdminDashboard tenants={tenants} />
    </div>
  );
}
