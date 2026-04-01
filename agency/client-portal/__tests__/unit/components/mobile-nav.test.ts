/**
 * Unit tests for the mobile navigation nav-item filtering logic.
 *
 * The mobile nav (bottom tab bar) shows up to 5 items, filtered by enabled features.
 * The spec says: "5 items max: Dashboard, Studio, Content, Support, Billing"
 * All 5 nav items are shown in the bottom bar — feature flags control visibility.
 */

import { describe, it, expect } from "vitest"
import { getMobileNavItems, type MobileNavItem } from "@/components/portal/mobile-nav"

const DASHBOARD = { key: "dashboard", href: "/dashboard", label: "Dashboard" }
const STUDIO = { key: "studio", href: "/studio", label: "Site Editor" }
const CONTENT = { key: "content", href: "/content", label: "Content" }
const SUPPORT = { key: "support", href: "/support", label: "Support" }
const BILLING = { key: "billing", href: "/billing", label: "Billing" }

describe("getMobileNavItems", () => {
  it("always includes dashboard regardless of feature flags", async () => {
    const items = await getMobileNavItems({}, "/any-path")
    const dashboard = items.find((i) => i.key === "dashboard")
    expect(dashboard).toBeDefined()
    expect(dashboard?.href).toBe("/dashboard")
  })

  it("includes feature-gated items only when their flag is enabled", async () => {
    const enabledFeatures = { studio: true, support: true, billing: false, content_hub: false }
    const items = await getMobileNavItems(enabledFeatures, "/any-path")

    expect(items.some((i) => i.key === "studio")).toBe(true)
    expect(items.some((i) => i.key === "support")).toBe(true)
    expect(items.some((i) => i.key === "billing")).toBe(false)
    expect(items.some((i) => i.key === "content")).toBe(false)
  })

  it("includes all 5 items when all feature flags are enabled", async () => {
    const enabledFeatures = { studio: true, support: true, billing: true, content_hub: true }
    const items = await getMobileNavItems(enabledFeatures, "/any-path")

    expect(items.map((i) => i.key).sort()).toEqual(
      ["dashboard", "studio", "content", "support", "billing"].sort()
    )
  })

  it("excludes all non-dashboard items when no feature flags are enabled", async () => {
    const enabledFeatures = { studio: false, support: false, billing: false, content_hub: false }
    const items = await getMobileNavItems(enabledFeatures, "/any-path")

    expect(items.map((i) => i.key)).toEqual(["dashboard"])
  })

  it("never includes more than 5 items", async () => {
    const enabledFeatures = { studio: true, support: true, billing: true, content_hub: true }
    const items = await getMobileNavItems(enabledFeatures, "/any-path")

    expect(items.length).toBeLessThanOrEqual(5)
  })

  it("marks the active item based on current pathname", async () => {
    const enabledFeatures = { studio: true, support: true, billing: true, content_hub: true }
    const items = await getMobileNavItems(enabledFeatures, "/support")

    const active = items.find((i) => i.active)
    expect(active?.key).toBe("support")
  })

  it("marks dashboard as active when pathname is /dashboard", async () => {
    const items = await getMobileNavItems({}, "/dashboard")
    const active = items.find((i) => i.active)
    expect(active?.key).toBe("dashboard")
  })

  it("dashboard is active when no path matches (fallback)", async () => {
    const items = await getMobileNavItems({}, "/some-unknown-path")
    // No item should be marked active for unknown paths
    expect(items.every((i) => !i.active)).toBe(true)
  })
})
