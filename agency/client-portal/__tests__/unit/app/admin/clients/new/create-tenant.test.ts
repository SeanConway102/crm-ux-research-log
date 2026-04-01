/**
 * Tests for the admin "Create Tenant" server action.
 * Tests the validation logic and tenant creation simulation.
 *
 * The server action creates:
 * 1. A Prisma Tenant record
 * 2. A Redis subdomain entry
 * 3. TenantFeatureFlag records for all seeded feature flags
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── In-memory mock of the data layer ────────────────────────────────────────

type DbState = Map<string, unknown>
type RedisState = Map<string, unknown>
type Cache = Map<string, { flags: Record<string, boolean>; ts: number }>

const FEATURE_FLAGS = [
  { id: "flag-1", key: "studio", label: "Site Editor", description: "Studio", isBeta: false },
  { id: "flag-2", key: "support", label: "Support Tickets", description: "Support", isBeta: false },
  { id: "flag-3", key: "billing", label: "Billing", description: "Billing", isBeta: false },
  { id: "flag-4", key: "tv_feed", label: "TV Feed", description: "TV", isBeta: true },
  { id: "flag-5", key: "media_library", label: "Media Library", description: "Media", isBeta: true },
  { id: "flag-6", key: "content_hub", label: "Content Hub", description: "Content", isBeta: false },
] as const

// ─── Validation helpers (mirror the server action) ───────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z9]$/.test(slug)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ─── Simulated server action logic ───────────────────────────────────────────

type CreateTenantResult =
  | { success: true; tenantId: string }
  | { success: false; error: string }

function validateCreateTenantInput(formData: FormData): CreateTenantResult {
  const name = (formData.get("name") as string | null)?.trim() ?? ""
  const slug = (formData.get("slug") as string | null)?.trim() ?? ""
  const domain = (formData.get("domain") as string | null)?.trim() ?? ""
  const logoUrl = (formData.get("logoUrl") as string | null)?.trim() ?? ""
  const accentColor = (formData.get("accentColor") as string | null)?.trim() ?? "#6366F1"

  if (!name) return { success: false, error: "Client name is required." }
  if (!slug) return { success: false, error: "Subdomain is required." }
  if (!isValidSlug(slug)) {
    return { success: false, error: "Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number." }
  }
  if (domain && !isValidUrl(`https://${domain}`)) {
    return { success: false, error: "Please enter a valid domain (e.g. example.com)." }
  }
  if (logoUrl && !isValidUrl(logoUrl)) {
    return { success: false, error: "Please enter a valid URL for the logo." }
  }
  return { success: true, tenantId: "placeholder" }
}

function simulateCreateTenant(
  db: DbState,
  redis: RedisState,
  formData: FormData
): CreateTenantResult {
  // Validation
  const validation = validateCreateTenantInput(formData)
  if (!validation.success) return validation

  const slug = (formData.get("slug") as string).trim().toLowerCase()
  const name = (formData.get("name") as string).trim()
  const domain = (formData.get("domain") as string | null)?.trim() ?? ""
  const logoUrl = (formData.get("logoUrl") as string | null)?.trim() ?? ""
  const accentColor = (formData.get("accentColor") as string | null)?.trim() ?? "#6366F1"

  // Check slug uniqueness
  const existingTenant = Array.from(db.values()).find(
    (t: any) => t.slug === slug
  ) as { slug: string } | undefined
  if (existingTenant) {
    return { success: false, error: "A client with this subdomain already exists." }
  }

  // Check Redis uniqueness
  if (redis.has(`subdomain:${slug}`)) {
    return { success: false, error: "A client with this subdomain already exists." }
  }

  const tenantId = `tenant-${slug}-${Date.now()}`

  // Create tenant
  db.set(tenantId, {
    id: tenantId,
    slug,
    name,
    domain: domain || null,
    type: "CLIENT",
    logoUrl: logoUrl || null,
    accentColor,
    crmSiteId: null,
    sanityDataset: "production",
    createdAt: new Date(),
  })

  // Create Redis entry
  redis.set(`subdomain:${slug}`, {
    emoji: "🏢",
    createdAt: Date.now(),
  })

  // Seed feature flags (all disabled by default — agency admin enables them)
  FEATURE_FLAGS.forEach((flag) => {
    db.set(`${tenantId}:${flag.id}`, {
      tenantId,
      featureFlagId: flag.id,
      enabled: false,
    })
  })

  return { success: true, tenantId }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("converts client name to lowercase slug", () => {
    expect(slugify("Acme Corporation")).toBe("acme-corporation")
    expect(slugify("John's Widgets")).toBe("john-s-widgets")
    expect(slugify("  Test Client  ")).toBe("test-client")
  })
})

describe("isValidSlug", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("acme")).toBe(true)
    expect(isValidSlug("acme-corp")).toBe(true)
    expect(isValidSlug("acme-corp-123")).toBe(true)
    expect(isValidSlug("a")).toBe(true)
    expect(isValidSlug("a1")).toBe(true)
  })

  it("rejects invalid slugs", () => {
    expect(isValidSlug("")).toBe(false)
    expect(isValidSlug("AcMe")).toBe(false)
    expect(isValidSlug("acme corp")).toBe(false)
    expect(isValidSlug("acme_corp")).toBe(false)
    expect(isValidSlug("-acme")).toBe(false)
    expect(isValidSlug("acme-")).toBe(false)
    expect(isValidSlug("acme!")).toBe(false)
  })
})

describe("validateCreateTenantInput", () => {
  it("returns error when name is missing", () => {
    const fd = new FormData()
    fd.set("slug", "acme")
    fd.set("domain", "acme.com")
    expect(validateCreateTenantInput(fd)).toEqual({ success: false, error: "Client name is required." })
  })

  it("returns error when slug is missing", () => {
    const fd = new FormData()
    fd.set("name", "Acme Corp")
    expect(validateCreateTenantInput(fd)).toEqual({ success: false, error: "Subdomain is required." })
  })

  it("returns error for invalid slug characters", () => {
    const fd = new FormData()
    fd.set("name", "Acme")
    fd.set("slug", "AcMe Corp!")
    expect(validateCreateTenantInput(fd)).toEqual({
      success: false,
      error: "Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number.",
    })
  })

  it("returns error for slug starting with hyphen", () => {
    const fd = new FormData()
    fd.set("name", "Acme")
    fd.set("slug", "-acme")
    expect(validateCreateTenantInput(fd)).toEqual({
      success: false,
      error: "Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number.",
    })
  })

  it("returns error for invalid domain URL", () => {
    const fd = new FormData()
    fd.set("name", "Acme")
    fd.set("slug", "acme")
    fd.set("domain", "not a domain")
    expect(validateCreateTenantInput(fd)).toEqual({ success: false, error: "Please enter a valid domain (e.g. example.com)." })
  })

  it("returns error for invalid logo URL", () => {
    const fd = new FormData()
    fd.set("name", "Acme")
    fd.set("slug", "acme")
    fd.set("domain", "acme.com")
    fd.set("logoUrl", "not-a-url")
    expect(validateCreateTenantInput(fd)).toEqual({ success: false, error: "Please enter a valid URL for the logo." })
  })

  it("passes with all valid fields", () => {
    const fd = new FormData()
    fd.set("name", "Acme Corp")
    fd.set("slug", "acme")
    fd.set("domain", "acme.com")
    fd.set("logoUrl", "https://acme.com/logo.png")
    fd.set("accentColor", "#FF5733")
    expect(validateCreateTenantInput(fd)).toEqual({ success: true, tenantId: "placeholder" })
  })

  it("passes without optional fields", () => {
    const fd = new FormData()
    fd.set("name", "Acme Corp")
    fd.set("slug", "acme")
    expect(validateCreateTenantInput(fd)).toEqual({ success: true, tenantId: "placeholder" })
  })
})

describe("simulateCreateTenant", () => {
  let db: DbState
  let redis: RedisState

  beforeEach(() => {
    db = new Map()
    redis = new Map()
  })

  it("creates a tenant and subdomain entry", () => {
    const fd = new FormData()
    fd.set("name", "Acme Corporation")
    fd.set("slug", "acme")
    fd.set("domain", "acme.com")
    fd.set("accentColor", "#FF5733")

    const result = simulateCreateTenant(db, redis, fd)
    expect(result.success).toBe(true)
    expect((result as any).tenantId).toBeDefined()

    const tenantId = (result as any).tenantId
    expect(db.get(tenantId)).toMatchObject({
      slug: "acme",
      name: "Acme Corporation",
      domain: "acme.com",
      type: "CLIENT",
      accentColor: "#FF5733",
    })
    expect(redis.get("subdomain:acme")).toMatchObject({
      emoji: "🏢",
    })
  })

  it("seeds all feature flags for the new tenant (disabled)", () => {
    const fd = new FormData()
    fd.set("name", "Test Client")
    fd.set("slug", "test")

    const result = simulateCreateTenant(db, redis, fd)
    expect(result.success).toBe(true)
    const tenantId = (result as any).tenantId

    FEATURE_FLAGS.forEach((flag) => {
      const flagRecord = db.get(`${tenantId}:${flag.id}`)
      expect(flagRecord).toMatchObject({
        tenantId,
        featureFlagId: flag.id,
        enabled: false,
      })
    })
  })

  it("rejects duplicate slug", () => {
    const fd1 = new FormData()
    fd1.set("name", "Client A")
    fd1.set("slug", "acme")
    simulateCreateTenant(db, redis, fd1)

    const fd2 = new FormData()
    fd2.set("name", "Client B")
    fd2.set("slug", "acme")
    const result = simulateCreateTenant(db, redis, fd2)
    expect(result.success).toBe(false)
    expect((result as any).error).toContain("already exists")
  })

  it("rejects duplicate Redis subdomain", () => {
    redis.set("subdomain:acme", { emoji: "🏢", createdAt: Date.now() })

    const fd = new FormData()
    fd.set("name", "Client")
    fd.set("slug", "acme")
    const result = simulateCreateTenant(db, redis, fd)
    expect(result.success).toBe(false)
    expect((result as any).error).toContain("already exists")
  })
})
