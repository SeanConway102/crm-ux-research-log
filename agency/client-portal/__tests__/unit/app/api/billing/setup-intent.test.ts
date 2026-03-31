import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as createSetupIntent } from "../../../../../app/api/billing/setup-intent/route"
import type { NextRequest } from "next/server"

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/crm-api", () => ({
  getCrmSubscription: vi.fn(),
}))

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
}))

import { auth } from "@/lib/auth"
import { getCrmSubscription } from "@/lib/crm-api"
import { getStripe } from "@/lib/stripe"

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetCrmSubscription = getCrmSubscription as ReturnType<typeof vi.fn>
const mockGetStripe = getStripe as ReturnType<typeof vi.fn>

// Mock Stripe instance
const mockStripeInstance = {
  customers: {
    retrieve: vi.fn(),
  },
  setupIntents: {
    create: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetStripe.mockReturnValue(mockStripeInstance)
})

function makeRequest(body?: unknown): NextRequest {
  return {
    method: "POST",
    url: "https://portal.example.com/api/billing/setup-intent",
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => (body ?? {}) as Record<string, unknown>,
    text: async () => JSON.stringify(body ?? {}),
    nextUrl: new URL("https://portal.example.com/api/billing/setup-intent"),
  } as unknown as NextRequest
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/billing/setup-intent", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const res = await createSetupIntent(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 404 when no subscription found", async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: "tenant-abc", email: "client@example.com" },
    })
    mockGetCrmSubscription.mockResolvedValue(null)

    const res = await createSetupIntent(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe("No subscription found for this account.")
  })

  it("returns 422 when stripe_customer_id is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: "tenant-abc", email: "client@example.com" },
    })
    mockGetCrmSubscription.mockResolvedValue({
      id: "sub_123",
      tenant_id: "tenant-abc",
      status: "incomplete",
      plan_name: "Starter",
      plan_amount: 4900,
      plan_interval: "month",
      current_period_end: "2026-04-30",
      stripe_customer_id: null,
      stripe_subscription_id: "sub_xyz",
    })

    const res = await createSetupIntent(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe("stripe_customer_not_found")
  })

  it("returns 422 when Stripe customer does not exist", async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: "tenant-abc", email: "client@example.com" },
    })
    mockGetCrmSubscription.mockResolvedValue({
      id: "sub_123",
      tenant_id: "tenant-abc",
      status: "past_due",
      plan_name: "Starter",
      plan_amount: 4900,
      plan_interval: "month",
      current_period_end: "2026-04-30",
      stripe_customer_id: "cus_nonexistent",
      stripe_subscription_id: "sub_xyz",
    })

    // Stripe customer retrieve throws (customer not found)
    mockStripeInstance.customers.retrieve.mockRejectedValue(
      new Error("No such customer")
    )

    const res = await createSetupIntent(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe("stripe_customer_not_found")
  })

  it("returns 200 with client_secret on success", async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: "tenant-abc", email: "client@example.com" },
    })
    mockGetCrmSubscription.mockResolvedValue({
      id: "sub_123",
      tenant_id: "tenant-abc",
      status: "past_due",
      plan_name: "Starter",
      plan_amount: 4900,
      plan_interval: "month",
      current_period_end: "2026-04-30",
      stripe_customer_id: "cus_abc123",
      stripe_subscription_id: "sub_xyz",
    })

    mockStripeInstance.customers.retrieve.mockResolvedValue({ id: "cus_abc123" })

    const mockSetupIntent = {
      id: "seti_xyz789",
      client_secret: "seti_xyz789_secret_deadbeef",
      status: "requires_payment_method",
      usage: "off_session",
    }
    mockStripeInstance.setupIntents.create.mockResolvedValue(mockSetupIntent)

    // Temporarily override env var for publishable key
    const originalEnv = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_example"

    const res = await createSetupIntent(makeRequest())
    const body = await res.json()

    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalEnv

    expect(res.status).toBe(200)
    expect(body.clientSecret).toBe("seti_xyz789_secret_deadbeef")
    expect(body.publishableKey).toBe("pk_test_example")

    // Verify the SetupIntent was created with correct params
    expect(mockStripeInstance.setupIntents.create).toHaveBeenCalledOnce()
    const createCall = mockStripeInstance.setupIntents.create.mock.calls[0]![0]
    expect(createCall.customer).toBe("cus_abc123")
    expect(createCall.payment_method_types).toEqual(["card"])
    expect(createCall.usage).toBe("off_session")
  })

  it("returns 500 when Stripe SetupIntent creation fails", async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: "tenant-abc", email: "client@example.com" },
    })
    mockGetCrmSubscription.mockResolvedValue({
      id: "sub_123",
      tenant_id: "tenant-abc",
      status: "past_due",
      plan_name: "Starter",
      plan_amount: 4900,
      plan_interval: "month",
      current_period_end: "2026-04-30",
      stripe_customer_id: "cus_abc123",
      stripe_subscription_id: "sub_xyz",
    })

    mockStripeInstance.customers.retrieve.mockResolvedValue({ id: "cus_abc123" })
    mockStripeInstance.setupIntents.create.mockRejectedValue(
      new Error("Stripe API error")
    )

    const res = await createSetupIntent(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe("Failed to initialize payment. Please try again.")
  })
})
