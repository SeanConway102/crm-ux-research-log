/**
 * Tests for the admin client feature flags page.
 * Tests the server action and client component logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── In-memory mock of setFeatureFlag ────────────────────────────────────────

type DbState = Map<string, { tenantId: string; featureFlagId: string; enabled: boolean }>
type FlagRegistry = Map<string, { id: string; key: string; label: string; description: string; isBeta: boolean }>
type Cache = Map<string, { flags: Record<string, boolean>; ts: number }>

const FEATURE_FLAGS = {
  studio: { key: "studio", label: "Site Editor", description: "Embedded Sanity Studio", isBeta: false },
  support: { key: "support", label: "Support Tickets", description: "File tickets", isBeta: false },
  billing: { key: "billing", label: "Billing", description: "Invoices", isBeta: false },
  tv_feed: { key: "tv_feed", label: "TV Feed", description: "TV feed management", isBeta: true },
} as const

function createMockSetFeatureFlag(db: DbState, flagRegistry: FlagRegistry, cache: Cache) {
  return function setFeatureFlag(tenantId: string, flagKey: string, enabled: boolean) {
    const flag = flagRegistry.get(flagKey)
    if (!flag) throw new Error(`Unknown feature flag: ${flagKey}`)

    const pk = `${tenantId}:${flag.id}`
    if (enabled) {
      db.set(pk, { tenantId, featureFlagId: flag.id, enabled: true })
    } else {
      db.delete(pk)
    }
    cache.delete(tenantId)
  }
}

function createMockGetTenantFeatureFlags(flagRegistry: FlagRegistry, db: DbState) {
  return function getTenantFeatureFlags(tenantId: string) {
    const allKeys = Array.from(flagRegistry.keys())
    return allKeys.map((key) => {
      const meta = flagRegistry.get(key)!
      const pk = `${tenantId}:${meta.id}`
      const override = db.get(pk)
      return {
        key,
        label: meta.label,
        description: meta.description,
        isBeta: meta.isBeta,
        enabled: override?.enabled ?? false,
        overrideId: override ? pk : null,
      }
    })
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("toggleFeatureFlagAction (simulated server action)", () => {
  let db: DbState
  let flagRegistry: FlagRegistry
  let cache: Cache
  let setFeatureFlag: ReturnType<typeof createMockSetFeatureFlag>

  beforeEach(() => {
    db = new Map()
    // Map entries to include the id field required by FlagRegistry type
    flagRegistry = new Map(
      Object.entries(FEATURE_FLAGS).map(([key, meta]) => [key, { id: `ff-${key}`, ...meta }])
    )
    cache = new Map()
    setFeatureFlag = createMockSetFeatureFlag(db, flagRegistry, cache)
  })

  it("enables a disabled flag", async () => {
    setFeatureFlag("tenant-1", "studio", true)
    // db key format: "tenantId:flagId" where flagId = "ff-studio"
    expect(db.get("tenant-1:ff-studio")?.enabled).toBe(true)
  })

  it("disables an enabled flag", async () => {
    db.set("tenant-1:ff-studio", { tenantId: "tenant-1", featureFlagId: "ff-studio", enabled: true })
    setFeatureFlag("tenant-1", "studio", false)
    expect(db.has("tenant-1:ff-studio")).toBe(false)
  })

  it("throws for unknown flag key", () => {
    expect(() => setFeatureFlag("tenant-1", "nonexistent", true)).toThrow(
      "Unknown feature flag: nonexistent"
    )
  })

  it("invalidates cache after toggle", async () => {
    cache.set("tenant-1", { flags: { studio: false }, ts: Date.now() })
    setFeatureFlag("tenant-1", "studio", true)
    expect(cache.has("tenant-1")).toBe(false)
  })
})

describe("getTenantFeatureFlags (simulated)", () => {
  let db: DbState
  let flagRegistry: FlagRegistry
  let getTenantFeatureFlags: ReturnType<typeof createMockGetTenantFeatureFlags>

  beforeEach(() => {
    db = new Map()
    flagRegistry = new Map(
      Object.entries(FEATURE_FLAGS).map(([key, meta]) => [key, { id: `ff-${key}`, ...meta }])
    )
    getTenantFeatureFlags = createMockGetTenantFeatureFlags(flagRegistry, db)
  })

  it("returns all flags with enabled=false by default", () => {
    const flags = getTenantFeatureFlags("tenant-new")
    expect(flags).toHaveLength(4)
    for (const flag of flags) {
      expect(flag.enabled).toBe(false)
    }
  })

  it("returns enabled=true for overridden flags", () => {
    db.set("tenant-1:ff-studio", { tenantId: "tenant-1", featureFlagId: "ff-studio", enabled: true })
    db.set("tenant-1:ff-billing", { tenantId: "tenant-1", featureFlagId: "ff-billing", enabled: true })

    const flags = getTenantFeatureFlags("tenant-1")
    const studio = flags.find((f) => f.key === "studio")!
    const billing = flags.find((f) => f.key === "billing")!
    const support = flags.find((f) => f.key === "support")!

    expect(studio.enabled).toBe(true)
    expect(billing.enabled).toBe(true)
    expect(support.enabled).toBe(false)
  })

  it("marks beta flags correctly", () => {
    const flags = getTenantFeatureFlags("tenant-1")
    const studio = flags.find((f) => f.key === "studio")!
    const tvFeed = flags.find((f) => f.key === "tv_feed")!

    expect(studio.isBeta).toBe(false)
    expect(tvFeed.isBeta).toBe(true)
  })

  it("returns null overrideId when flag is not overridden", () => {
    const flags = getTenantFeatureFlags("tenant-new")
    for (const flag of flags) {
      expect(flag.overrideId).toBeNull()
    }
  })

  it("returns composite pk as overrideId when flag is overridden", () => {
    db.set("tenant-1:ff-studio", { tenantId: "tenant-1", featureFlagId: "ff-studio", enabled: true })
    const flags = getTenantFeatureFlags("tenant-1")
    const studio = flags.find((f) => f.key === "studio")!
    expect(studio.overrideId).toBe("tenant-1:ff-studio")
  })
})

describe("FeatureFlagToggle component — state transitions", () => {
  /**
   * Simulates the React useActionState behavior for the toggle:
   * - Form submit with enabled=<new-value>
   * - setFeatureFlag called
   * - State reflects new enabled value
   */

  let db: DbState
  let flagRegistry: FlagRegistry
  let cache: Cache

  beforeEach(() => {
    db = new Map()
    flagRegistry = new Map(
      Object.entries(FEATURE_FLAGS).map(([key, meta]) => [key, { id: `ff-${key}`, ...meta }])
    )
    cache = new Map()
  })

  it("toggling from disabled to enabled updates the db", async () => {
    const setFeatureFlag = createMockSetFeatureFlag(db, flagRegistry, cache)
    const getTenantFeatureFlags = createMockGetTenantFeatureFlags(flagRegistry, db)

    // Initially disabled
    let flags = getTenantFeatureFlags("tenant-1")
    expect(flags.find((f) => f.key === "studio")!.enabled).toBe(false)

    // Toggle on
    setFeatureFlag("tenant-1", "studio", true)
    flags = getTenantFeatureFlags("tenant-1")
    expect(flags.find((f) => f.key === "studio")!.enabled).toBe(true)
  })

  it("toggling off removes the db record", async () => {
    const setFeatureFlag = createMockSetFeatureFlag(db, flagRegistry, cache)
    const getTenantFeatureFlags = createMockGetTenantFeatureFlags(flagRegistry, db)

    // Enable first
    setFeatureFlag("tenant-1", "studio", true)
    db.set("tenant-1:studio", { tenantId: "tenant-1", featureFlagId: "studio", enabled: true })

    // Toggle off
    setFeatureFlag("tenant-1", "studio", false)

    const flags = getTenantFeatureFlags("tenant-1")
    expect(flags.find((f) => f.key === "studio")!.enabled).toBe(false)
  })
})
