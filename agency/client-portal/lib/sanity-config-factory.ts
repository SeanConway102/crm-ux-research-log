/**
 * Sanity config factory — Phase 2b.
 *
 * Builds a per-tenant Sanity Studio config with:
 *   • structureTool  — customisable desk structure
 *   • visionTool      — GROQ query playground (for debugging)
 *
 * Phase 2b also sets a per-tenant Studio title.
 *
 * @see SPEC.md Phase 2b
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
  title: string
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
  // TypeScript cannot resolve it statically (pnpm nested node_modules).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-ignore
  const { defineConfig, structureTool, visionTool }: any = await import("sanity")

  // 1. Look up the tenant to get its CRM site ID and name
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

  // 5. Per-tenant Studio title (Phase 2b)
  const studioTitle = `${tenant.name} — Content Editor`

  // 6. Build the default desk structure.
  //
  //    Uses S.documentTypeList() which auto-generates a list for every schema
  //    type registered in the config — no need to enumerate types here.
  //    Tenants with custom schema types automatically get those types listed.
  //
  //    Structure builder docs:
  //    https://www.sanity.io/docs/studio/structure-tool
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deskStructure = (S: any) =>
    S.list()
      .title("Content")
      .items([
        // "Singleton" placeholder for the home page — most sites have one
        S.listItem()
          .title("Home Page")
          .child(
            S.document()
              .schemaType("page")
              .documentId("home-page")
          ),
        S.divider(),
        // Dynamic list of all document types registered in the schema.
        // This is the key pattern for multi-tenant: we don't know which
        // schema types each tenant has, so we list them all dynamically.
        ...S.documentTypeListItems(),
      ])

  // 7. Build and return the config with plugins + editor token
  return defineConfig({
    basePath: "/studio",
    projectId,
    dataset,
    title: studioTitle,
    schema: {
      types: [],
    },
    plugins: [
      structureTool({ structure: deskStructure }),
      visionTool(),
    ],
    // Token authenticates write operations in the embedded Studio
    token: process.env.SANITY_API_TOKEN,
  }) as StudioConfig
}
