/**
 * lib/features.ts — Feature Flag evaluation service
 *
 * Architecture:
 * - Flags are stored in Prisma (FeatureFlag + TenantFeatureFlag tables)
 * - This module uses an in-memory cache (Map) to avoid hitting the DB on every call.
 * - The cache is module-level, so it persists across invocations in the same
 *   serverless function instance (Vercel Warm Concurrency).
 * - TTL of 60s means flag changes propagate within 60 seconds — acceptable for
 *   a portal where features don't change constantly.
 *
 * NOTE: Middleware runs on Edge Runtime which cannot use Prisma.
 * Feature flag enforcement lives in page components + API routes (Node.js runtime).
 */

import { prisma } from "@/lib/prisma"

// ─── Static registry (source of truth for flag metadata) ─────────────────────

export const FEATURE_FLAGS = {
  studio: {
    key: "studio",
    label: "Site Editor",
    description: "Embedded Sanity Studio for content editing",
    isBeta: false,
    route: "/studio",
  },
  support: {
    key: "support",
    label: "Support Tickets",
    description: "File and track support tickets",
    isBeta: false,
    route: "/support",
  },
  billing: {
    key: "billing",
    label: "Billing",
    description: "Subscription status, invoices, and payment management",
    isBeta: false,
    route: "/billing",
  },
  content_hub: {
    key: "content_hub",
    label: "Content Hub",
    description: "Overview of content types with links to Studio",
    isBeta: false,
    route: "/content",
  },
  tv_feed: {
    key: "tv_feed",
    label: "TV Feed",
    description: "Satellite TV feed management",
    isBeta: true,
    route: "/content/tv-feed",
  },
  media_library: {
    key: "media_library",
    label: "Media Library",
    description: "Sanity media browser for managing images and files",
    isBeta: true,
    route: "/content/media",
  },
} as const

export type FeatureKey = keyof typeof FEATURE_FLAGS

// ─── In-memory cache ─────────────────────────────────────────────────────────

interface CacheEntry {
  flags: Record<string, boolean>
  ts: number
}

const CACHE_TTL_MS = 60_000 // 60 seconds

// Module-level cache — persists across invocations in the same instance
const cache = new Map<string, CacheEntry>()

function getCached(tenantId: string): Record<string, boolean> | null {
  const entry = cache.get(tenantId)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(tenantId)
    return null
  }
  return entry.flags
}

function setCached(tenantId: string, flags: Record<string, boolean>) {
  cache.set(tenantId, { flags, ts: Date.now() })
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Check if a specific feature flag is enabled for a tenant.
 * Returns false for unknown flag keys (safe default).
 */
export async function isFeatureEnabled(
  tenantId: string,
  flagKey: string
): Promise<boolean> {
  const enabled = (await getEnabledFeatures(tenantId))[flagKey]
  return enabled ?? false
}

/**
 * Get all enabled feature flags for a tenant.
 * Cached in-memory with 60s TTL.
 */
export async function getEnabledFeatures(
  tenantId: string
): Promise<Record<string, boolean>> {
  const cached = getCached(tenantId)
  if (cached) return cached

  // Build a map of all known flags, defaulting to false
  const allFlags = Object.keys(FEATURE_FLAGS).reduce<Record<string, boolean>>(
    (acc, key) => {
      acc[key] = false
      return acc
    },
    {}
  )

  // Override with tenant-specific enabled flags from DB
  const tenantFlags = await prisma.tenantFeatureFlag.findMany({
    where: { tenantId },
    include: { featureFlag: { select: { key: true } } },
  })

  for (const tf of tenantFlags) {
    if (tf.enabled && tf.featureFlag.key in allFlags) {
      allFlags[tf.featureFlag.key] = true
    }
  }

  setCached(tenantId, allFlags)
  return allFlags
}

/**
 * Get all feature flags (including disabled ones) with their metadata.
 * Useful for admin UIs that need the full registry.
 */
export async function getAllFeatureFlags() {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  })
  return flags
}

/**
 * Get feature flag overrides for a specific tenant (enabled/disabled status).
 */
export async function getTenantFeatureFlags(tenantId: string) {
  const overrides = await prisma.tenantFeatureFlag.findMany({
    where: { tenantId },
    include: { featureFlag: true },
  })

  // Merge with registry to include flags that have no override yet
  const allKeys = Object.keys(FEATURE_FLAGS)
  const result = allKeys.map((key) => {
    const override = overrides.find((o) => o.featureFlag.key === key)
    const meta = FEATURE_FLAGS[key as FeatureKey]
    return {
      key,
      label: meta.label,
      description: meta.description,
      isBeta: meta.isBeta,
      enabled: override?.enabled ?? false,
      // Composite PK: no single 'id' field — use the compound key as the override identity
      overrideId: override ? `${override.tenantId}:${override.featureFlagId}` : null,
    }
  })

  return result
}

/**
 * Set a feature flag for a tenant (upsert).
 */
export async function setFeatureFlag(
  tenantId: string,
  flagKey: string,
  enabled: boolean
): Promise<void> {
  const flag = await prisma.featureFlag.findUnique({ where: { key: flagKey } })
  if (!flag) throw new Error(`Unknown feature flag: ${flagKey}`)

  if (enabled) {
    await prisma.tenantFeatureFlag.upsert({
      where: {
        tenantId_featureFlagId: { tenantId, featureFlagId: flag.id },
      },
      update: { enabled },
      create: { tenantId, featureFlagId: flag.id, enabled },
    })
  } else {
    // Remove the override to return to default (false)
    await prisma.tenantFeatureFlag.deleteMany({
      where: { tenantId, featureFlagId: flag.id },
    })
  }

  // Invalidate cache so next call picks up the change
  cache.delete(tenantId)
}

/**
 * Invalidate the cached flags for a tenant (call after bulk operations).
 */
export function invalidateCache(tenantId: string) {
  cache.delete(tenantId)
}

/**
 * Validate that a flag key exists in the registry.
 */
export function isValidFlagKey(key: string): key is FeatureKey {
  return key in FEATURE_FLAGS
}

/**
 * Get the route that a feature flag guards.
 */
export function getFlagRoute(key: FeatureKey): string {
  return FEATURE_FLAGS[key]?.route ?? `/${key}`
}
