import { prisma } from "@/lib/prisma"

export const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
export const PORTAL_SUBDOMAIN = "portal"

/**
 * Extract the subdomain from a hostname.
 * "admin.acme-corp.clientsite.com" → "admin.acme-corp"
 * "portal.ctwebsiteco.com" → "portal"
 * "acme-corp.localhost:3000" → "acme-corp" (dev fallback)
 *
 * @param hostname - The full hostname from the request (may include port)
 * @param rootDomainOverride - Override ROOT_DOMAIN for testing. Defaults to env value.
 */
export function extractSubdomain(
  hostname: string,
  rootDomainOverride?: string
): string | null {
  // Strip port
  const host = hostname.split(":")[0]

  // Resolve root domain (env value or test override)
  const rootDomain = rootDomainOverride ?? ROOT_DOMAIN
  const rootDomainParts = rootDomain.split(":")[0].split(".")
  const hostParts = host.split(".")

  // Local dev: subdomain.localhost (or subdomain.127.0.0.1)
  if (
    host.includes(".localhost") ||
    host.includes("127.0.0.1") ||
    hostParts.every((p) => p === "localhost")
  ) {
    // "acme-corp.localhost" → ["acme-corp", "localhost"]
    if (hostParts.length >= 2 && hostParts[hostParts.length - 1] === "localhost") {
      return hostParts[0] || null
    }
    // "localhost" alone
    if (host === "localhost" || host === "127.0.0.1") {
      return null
    }
    return null
  }

  // Production: check if host ends with root domain
  if (
    hostParts.length > rootDomainParts.length &&
    hostParts.slice(-rootDomainParts.length).join(".") === rootDomainParts.join(".")
  ) {
    const subdomain = hostParts
      .slice(0, -rootDomainParts.length)
      .join(".")
    return subdomain || null
  }

  return null
}

/**
 * Get tenant from subdomain.
 * Returns null if not a recognized tenant.
 */
export async function getTenantBySubdomain(
  subdomain: string | null
): Promise<{ tenant: Awaited<ReturnType<typeof prisma.tenant.findUnique>>; type: "agency" | "client" | null }> {
  // No subdomain — treat as root domain (agency portal)
  if (!subdomain) {
    const agencyTenant = await prisma.tenant.findFirst({
      where: { type: "AGENCY" },
    })
    return { tenant: agencyTenant, type: agencyTenant ? "agency" : null }
  }

  // Is this the agency portal subdomain?
  if (subdomain === PORTAL_SUBDOMAIN) {
    const agencyTenant = await prisma.tenant.findFirst({
      where: { type: "AGENCY" },
    })
    return { tenant: agencyTenant, type: agencyTenant ? "agency" : null }
  }

  // Is this a client subdomain?
  const clientTenant = await prisma.tenant.findUnique({
    where: { subdomain },
  })

  if (clientTenant) {
    return { tenant: clientTenant, type: "client" }
  }

  // Fallback: treat subdomain as the tenant slug (path fallback URL)
  const slugTenant = await prisma.tenant.findUnique({
    where: { slug: subdomain },
  })

  if (slugTenant) {
    return { tenant: slugTenant, type: slugTenant.type === "AGENCY" ? "agency" : "client" }
  }

  return { tenant: null, type: null }
}

/**
 * Get tenant by slug — used in path-based fallback URLs.
 * e.g. /acme-corp/dashboard → tenant with slug "acme-corp"
 */
export async function getTenantBySlug(
  slug: string
): Promise<Awaited<ReturnType<typeof prisma.tenant.findUnique>> | null> {
  return prisma.tenant.findUnique({ where: { slug } })
}
