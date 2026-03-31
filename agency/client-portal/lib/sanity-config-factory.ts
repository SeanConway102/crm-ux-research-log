/**
 * Sanity config factory for the embedded Studio.
 *
 * Each tenant has its own Sanity project (stored in the CRM, fetched via
 * `crmSite.sanity_project_id`). This factory builds a per-tenant config at
 * request time — needed because:
 *
 *   1. Tenant credentials are dynamic (not known at build time)
 *   2. Each tenant's Sanity dataset may differ
 *   3. The agency may want to restrict Studio access per tenant
 *
 * Note: `NextStudio` (which carries `"use client"`) is what actually renders
 * the Studio UI. This factory produces a plain serializable config object that
 * is passed as a prop from a Server Component → Client Component.
 *
 * @see https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs
 */

import { getCrmSite } from "@/lib/crm-api"
import { prisma } from "@/lib/prisma"

// Type shape that matches what defineConfig returns and what NextStudio accepts.
// We define it locally to avoid importing from the `sanity` package, which lives
// in a pnpm nested node_modules path that TypeScript's moduleResolution: "bundler"
// cannot resolve statically (even though Node.js resolves it correctly at runtime).
type StudioConfig = {
  basePath: string
  projectId: string
  dataset: string
  schema: { types: unknown[] }
  plugins: unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * Build a Sanity Studio config for a specific tenant.
 *
 * Falls back to env-var defaults (NEXT_PUBLIC_SANITY_PROJECT_ID /
 * NEXT_PUBLIC_SANITY_DATASET) when tenant-specific credentials are not
 * available, so local development and un-provisioned tenants still render
 * the Studio shell without crashing.
 */
export async function buildSanityConfig(
  tenantSlug: string
): Promise<StudioConfig | null> {
  // Dynamic import keeps `sanity` out of the serverless bundle until needed.
  // At runtime, Node.js resolves `sanity` via pnpm's symlink structure.
  // TypeScript cannot resolve it statically (pnpm nested node_modules).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-ignore — sanity lives in pnpm nested node_modules; TS can't resolve it statically
  const { defineConfig }: any = await import("sanity")

  // 1. Look up the tenant to get its CRM site ID
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return null

  // 2. Fetch the linked CRM site to retrieve Sanity project credentials
  const crmSite = tenant.crmSiteId
    ? await getCrmSite(tenant.crmSiteId)
    : null

  // 3. Resolve project ID — CRM site takes precedence over env defaults
  const projectId =
    crmSite?.sanity_project_id ??
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
    null

  if (!projectId) return null

  // 4. Dataset: use tenant's own setting first, then env default
  const dataset =
    tenant.sanityDataset ??
    process.env.NEXT_PUBLIC_SANITY_DATASET ??
    "production"

  // 5. Build and return the config.
  //
  //    Plugins and schema types are intentionally minimal for Phase 2.
  //    Phase 2b will register shared CRM schema types:
  //      const { schemaTypes } = await import("@/crm-schema")
  //      return defineConfig({ ..., schema: { types: schemaTypes } })
  return defineConfig({
    basePath: "/studio", // Must match the route path
    projectId,
    dataset,
    schema: {
      types: [],
    },
    plugins: [],
  }) as StudioConfig
}
