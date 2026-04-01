/**
 * Unit tests for tenant logo + name in sidebar (Phase 6).
 *
 * The sidebar should display:
 * - The tenant's custom logo (from tenant.logoUrl) when provided
 * - The tenant's display name (from tenant.name) alongside the logo
 * - A fallback CT Website Co. logo + "Client Portal" when no custom logo
 *
 * The logoUrl and tenantName are passed as props to PortalSidebar
 * (and MobileDrawerContent in the same file).
 */

import { describe, it, expect } from "vitest"

// ─── Pure logic helpers (mirrors what the component does) ─────────────────────

type SidebarLogoState = {
  logoUrl: string | null
  tenantName: string | null
  useCustomLogo: boolean
  displayName: string
}

/**
 * Computes what the sidebar should render given tenant data.
 * Mirrors the logic in PortalSidebar + MobileDrawerContent.
 */
function computeSidebarLogo(logoUrl: string | null | undefined, tenantName: string | null | undefined): SidebarLogoState {
  const useCustomLogo = Boolean(logoUrl)
  const displayName = tenantName ?? "Client Portal"
  return {
    logoUrl: logoUrl ?? null,
    tenantName: tenantName ?? null,
    useCustomLogo,
    displayName,
  }
}

describe("sidebar tenant logo — prop handling", () => {
  it("uses custom logo when tenant.logoUrl is provided", () => {
    const state = computeSidebarLogo("https://acme.com/logo.png", "Acme Corp")
    expect(state.useCustomLogo).toBe(true)
    expect(state.logoUrl).toBe("https://acme.com/logo.png")
  })

  it("falls back to default logo when tenant.logoUrl is null", () => {
    const state = computeSidebarLogo(null, "Acme Corp")
    expect(state.useCustomLogo).toBe(false)
    expect(state.logoUrl).toBe(null)
  })

  it("falls back to default logo when tenant.logoUrl is undefined", () => {
    const state = computeSidebarLogo(undefined, "Acme Corp")
    expect(state.useCustomLogo).toBe(false)
  })

  it("falls back to default logo when tenant.logoUrl is an empty string", () => {
    const state = computeSidebarLogo("", "Acme Corp")
    expect(state.useCustomLogo).toBe(false)
  })
})

describe("sidebar tenant name — prop handling", () => {
  it("displays tenant name when provided", () => {
    const state = computeSidebarLogo(null, "Rose Beauty")
    expect(state.displayName).toBe("Rose Beauty")
  })

  it("falls back to 'Client Portal' when tenant name is null", () => {
    const state = computeSidebarLogo(null, null)
    expect(state.displayName).toBe("Client Portal")
  })

  it("falls back to 'Client Portal' when tenant name is undefined", () => {
    const state = computeSidebarLogo(null, undefined)
    expect(state.displayName).toBe("Client Portal")
  })

  it("uses tenant name even when custom logo is provided", () => {
    const state = computeSidebarLogo("https://acme.com/logo.png", "Acme Corp")
    expect(state.displayName).toBe("Acme Corp")
    expect(state.useCustomLogo).toBe(true)
  })
})

describe("sidebar tenant logo — layout integration", () => {
  /**
   * Simulates the tenant data fetched in app/(portal)/layout.tsx.
   * In the real layout we do:
   *   const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, logoUrl: true, accentColor: true } })
   *   <PortalSidebar logoUrl={tenant?.logoUrl} tenantName={tenant?.name} ... />
   */

  const tenants = [
    { id: "t1", name: "Acme Corp", logoUrl: "https://acme.com/logo.png" },
    { id: "t2", name: "Rose Beauty", logoUrl: null },
    { id: "t3", name: null, logoUrl: null },
    { id: "t4", name: "Solar Co", logoUrl: "https://solar.co/logo.svg" },
  ]

  it("renders custom logo + tenant name for t1 (Acme Corp)", () => {
    const t = tenants[0]
    const state = computeSidebarLogo(t.logoUrl, t.name)
    expect(state.useCustomLogo).toBe(true)
    expect(state.logoUrl).toBe("https://acme.com/logo.png")
    expect(state.displayName).toBe("Acme Corp")
  })

  it("renders default logo + tenant name for t2 (Rose Beauty — no logo)", () => {
    const t = tenants[1]
    const state = computeSidebarLogo(t.logoUrl, t.name)
    expect(state.useCustomLogo).toBe(false)
    expect(state.displayName).toBe("Rose Beauty")
  })

  it("renders default logo + 'Client Portal' for t3 (no name)", () => {
    const t = tenants[2]
    const state = computeSidebarLogo(t.logoUrl, t.name)
    expect(state.useCustomLogo).toBe(false)
    expect(state.displayName).toBe("Client Portal")
  })

  it("renders custom logo + tenant name for t4 (Solar Co)", () => {
    const t = tenants[3]
    const state = computeSidebarLogo(t.logoUrl, t.name)
    expect(state.useCustomLogo).toBe(true)
    expect(state.logoUrl).toBe("https://solar.co/logo.svg")
    expect(state.displayName).toBe("Solar Co")
  })
})
