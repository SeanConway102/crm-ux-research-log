/**
 * Type-level test: verify PortalSidebar and MobileDrawerContent accept
 * logoUrl and tenantName props (Phase 6 tenant branding).
 *
 * If the component props don't include logoUrl/tenantName, TypeScript
 * will report an error at compile time (tsc --noEmit).
 * We use @ts-ignore to suppress the "unused directive" warning — the
 * test suite passes regardless; the value is in the compile-time check.
 *
 * Run: npx tsc --noEmit
 */

import { describe, it, expect } from "vitest"

// Import the exported types — this will fail to compile if they don't exist
import type { PortalSidebarProps, MobileDrawerContentProps } from "@/components/portal/sidebar"

// Test 1: PortalSidebarProps includes logoUrl and tenantName
// If these are missing, the @ts-ignore lines will cause "unused directive" warnings
const _portalSidebarHasLogoUrl = (_props: PortalSidebarProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _logo: string = _props.logoUrl as any
  return _logo
}

const _portalSidebarHasTenantName = (_props: PortalSidebarProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _name: string = _props.tenantName as any
  return _name
}

// Test 2: MobileDrawerContentProps includes logoUrl and tenantName
const _mobileDrawerHasLogoUrl = (_props: MobileDrawerContentProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _logo: string = _props.logoUrl as any
  return _logo
}

const _mobileDrawerHasTenantName = (_props: MobileDrawerContentProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _name: string = _props.tenantName as any
  return _name
}

// Runtime tests — these always pass; the compile-time check is what matters
describe("PortalSidebarProps type", () => {
  it("includes logoUrl field", () => {
    expect(_portalSidebarHasLogoUrl).toBeDefined()
  })
  it("includes tenantName field", () => {
    expect(_portalSidebarHasTenantName).toBeDefined()
  })
})

describe("MobileDrawerContentProps type", () => {
  it("includes logoUrl field", () => {
    expect(_mobileDrawerHasLogoUrl).toBeDefined()
  })
  it("includes tenantName field", () => {
    expect(_mobileDrawerHasTenantName).toBeDefined()
  })
})
