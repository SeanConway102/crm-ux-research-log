/**
 * Tests for POST /api/billing/portal-session
 * (Stripe Customer Portal server-side redirect)
 *
 * GET is handled identically in the route, so the tests apply to both.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import type { NextRequest } from "next/server"

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
}))

vi.mock("@/lib/crm-api", () => ({
  getCrmSubscription: vi.fn(),
}))

import { auth } from "@/lib/auth"
import { getCrmSubscription } from "@/lib/crm-api"
import { getStripe } from "@/lib/stripe"

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetCrmSubscription = getCrmSubscription as ReturnType<typeof vi.fn>
const mockGetStripe = getStripe as ReturnType<typeof vi.fn>

const mockStripeInstance = {
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetStripe.mockReturnValue(mockStripeInstance)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(): NextRequest {
  return {
    method: "POST",
    url: "https://portal.example.com/api/billing/portal-session",
    headers: new Headers(),
  } as unknown as NextRequest
}

function makeGetRequest(): NextRequest {
  return {
    method: "GET",
    url: "https://portal.example.com/api/billing/portal-session",
    headers: new Headers(),
  } as unknown as NextRequest
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/billing/portal-session", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStripe.mockReturnValue(mockStripeInstance)
  })

  it("returns 401 when no session", async () => {
    const { POST } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue(null)

    const response = await POST(makeRequest())

    expect(response.status).toBe(401)
  })

  it("returns 401 when session has no tenantId", async () => {
    const { POST } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue({ user: {} })

    const response = await POST(makeRequest())

    expect(response.status).toBe(401)
  })

  it("returns 422 when no subscription found", async () => {
    const { POST } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue({ user: { tenantId: "tenant_acme" } })
    mockGetCrmSubscription.mockResolvedValue(null)

    const response = await POST(makeRequest())

    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.error).toContain("No Stripe customer")
  })

  it("returns 422 when subscription has no stripe_customer_id", async () => {
    const { POST } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue({ user: { tenantId: "tenant_acme" } })
    mockGetCrmSubscription.mockResolvedValue({ stripe_customer_id: null })

    const response = await POST(makeRequest())

    expect(response.status).toBe(422)
  })

  it("returns 500 when Stripe throws", async () => {
    const { POST } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue({ user: { tenantId: "tenant_acme" } })
    mockGetCrmSubscription.mockResolvedValue({ stripe_customer_id: "cus_test123" })
    mockStripeInstance.billingPortal.sessions.create.mockRejectedValue(
      new Error("Stripe down")
    )

    const response = await POST(makeRequest())

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toContain("Failed to create")
  })

  it("returns 500 when Stripe returns null url", async () => {
    const { POST } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue({ user: { tenantId: "tenant_acme" } })
    mockGetCrmSubscription.mockResolvedValue({ stripe_customer_id: "cus_test123" })
    mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
      url: null,
    })

    const response = await POST(makeRequest())

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toContain("empty portal URL")
  })

  it("calls Stripe billingPortal.sessions.create with correct args", async () => {
    const { POST } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue({ user: { tenantId: "tenant_acme" } })
    mockGetCrmSubscription.mockResolvedValue({ stripe_customer_id: "cus_test123" })
    mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/test_abc123",
    })

    // redirect() throws NEXT_REDIRECT — we don't test that Next.js internals here.
    // Verify the Stripe API was called correctly.
    try {
      await POST(makeRequest())
    } catch {
      // Expected
    }

    expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledOnce()
    expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_test123",
      return_url: expect.stringContaining("/billing"),
    })
  })
})

describe("GET /api/billing/portal-session", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStripe.mockReturnValue(mockStripeInstance)
  })

  it("returns 401 when no session", async () => {
    const { GET } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue(null)

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(401)
  })

  it("calls Stripe billingPortal.sessions.create when authenticated", async () => {
    const { GET } = await import("../../../../../app/api/billing/portal-session/route")
    mockAuth.mockResolvedValue({ user: { tenantId: "tenant_acme" } })
    mockGetCrmSubscription.mockResolvedValue({ stripe_customer_id: "cus_test123" })
    mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/get_abc",
    })

    try {
      await GET(makeGetRequest())
    } catch {
      // Expected
    }

    expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledOnce()
  })
})
