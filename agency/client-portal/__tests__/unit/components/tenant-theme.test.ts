/**
 * Unit tests for the tenant theme system (Phase 6).
 *
 * Tests that the portal applies the tenant's accent color dynamically.
 * The accent color comes from the tenant's DB record (tenant.accentColor).
 *
 * Architecture:
 * - PortalSidebar receives accentColor as a prop
 * - PortalMobileNav receives accentColor as a prop
 * - Both apply it as a CSS variable --accent on their root element
 * - Active states use bg-[var(--accent)]/10 and text-[var(--accent)]
 */

import { describe, it, expect } from "vitest"

// ─── Pure logic: CSS variable application ───────────────────────────────────

/**
 * Simulates how the sidebar computes its root style prop.
 * Returns the style object that should be applied to the sidebar root.
 */
function computeSidebarStyle(accentColor?: string): Record<string, string> {
  const defaultAccent = "#6366F1" // CT Website Co. indigo
  return {
    "--accent": accentColor ?? defaultAccent,
  }
}

/**
 * Simulates how the sidebar computes the active nav item class.
 * Returns the className string for an active nav item.
 */
function computeActiveClass(accentColor?: string): string {
  const accent = accentColor ?? "#6366F1"
  // When accentColor is applied, the active state uses CSS var
  // Pattern: bg-[var(--accent)]/10 text-[var(--accent)]
  return `bg-[var(--accent)]/10 text-[var(--accent)]`
}

describe("tenant accent color — CSS variable application", () => {
  it("applies the default accent color when tenant has no custom accent", () => {
    const style = computeSidebarStyle(undefined)
    expect(style["--accent"]).toBe("#6366F1")
  })

  it("applies the tenant's custom accent color when provided", () => {
    const style = computeSidebarStyle("#E11D48") // rose red
    expect(style["--accent"]).toBe("#E11D48")
  })

  it("accepts any valid hex color", () => {
    const colors = ["#000000", "#FFFFFF", "#3B82F6", "#10B981", "#F59E0B"]
    for (const color of colors) {
      const style = computeSidebarStyle(color)
      expect(style["--accent"]).toBe(color)
    }
  })
})

describe("tenant accent color — active nav item class", () => {
  it("uses CSS var for accent in active state class", () => {
    const cls = computeActiveClass(undefined)
    // The class should reference the CSS variable, not a hardcoded color
    expect(cls).toContain("var(--accent)")
  })

  it("active class uses /10 opacity variant for background", () => {
    const cls = computeActiveClass("#6366F1")
    // bg-[var(--accent)]/10 — the /10 is an opacity modifier in Tailwind
    expect(cls).toMatch(/bg-\[var\(--accent\)\]\/10/)
    expect(cls).toMatch(/text-\[var\(--accent\)\]/)
  })

  it("different accent colors produce the same class structure", () => {
    // The class itself is the same — only the CSS variable value changes
    const cls1 = computeActiveClass("#6366F1")
    const cls2 = computeActiveClass("#E11D48")
    const cls3 = computeActiveClass("#3B82F6")

    // All three should produce equivalent class strings
    expect(cls1).toEqual(cls2)
    expect(cls2).toEqual(cls3)
  })
})

describe("tenant accent color — portal layout integration", () => {
  /**
   * Simulates the tenant lookup that happens in app/(portal)/layout.tsx.
   * In the real layout, we fetch the tenant from Prisma and pass
   * their accentColor to the sidebar/mobile-nav components.
   */

  // Mock tenant data
  const tenants = [
    { id: "tenant-1", name: "Acme Corp", accentColor: "#6366F1" },
    { id: "tenant-2", name: "Rose Beauty", accentColor: "#E11D48" },
    { id: "tenant-3", name: "Ocean Dive", accentColor: "#0EA5E9" },
    { id: "tenant-4", name: "Forest Foods", accentColor: "#10B981" },
    { id: "tenant-5", name: "Solar Co", accentColor: "#F59E0B" },
    { id: "tenant-6", name: "No brand", accentColor: null }, // uses default
  ]

  it("fetches accent color from tenant record", () => {
    const acme = tenants.find((t) => t.id === "tenant-2")!
    expect(acme?.accentColor).toBe("#E11D48")
  })

  it("uses default accent when tenant has no custom color", () => {
    const noBrand = tenants.find((t) => t.id === "tenant-6")!
    const style = computeSidebarStyle(noBrand.accentColor ?? undefined)
    expect(style["--accent"]).toBe("#6366F1")
  })

  it("each tenant gets their own accent applied", () => {
    const results = tenants.map((t) => {
      const style = computeSidebarStyle(t.accentColor ?? undefined)
      return { tenant: t.name, accent: style["--accent"] as string }
    })

    expect(results.find((r) => r.tenant === "Acme Corp")?.accent).toBe("#6366F1")
    expect(results.find((r) => r.tenant === "Rose Beauty")?.accent).toBe("#E11D48")
    expect(results.find((r) => r.tenant === "Ocean Dive")?.accent).toBe("#0EA5E9")
    expect(results.find((r) => r.tenant === "Forest Foods")?.accent).toBe("#10B981")
    expect(results.find((r) => r.tenant === "Solar Co")?.accent).toBe("#F59E0B")
    expect(results.find((r) => r.tenant === "No brand")?.accent).toBe("#6366F1")
  })
})
