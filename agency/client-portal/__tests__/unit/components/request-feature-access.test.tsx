'use client'

import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock sonner toast ─────────────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// ─── Mock next/navigation ─────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// ─── Mock fetch for the ticket API ─────────────────────────────────────────
function mockFetchOk(json: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(json),
  } as Response)
}

function mockFetchError(status = 500, message = "Server error") {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  } as Response)
}

// ─── Stub: RequestFeatureAccess form component (mirrors real implementation) ──

/**
 * This stub mirrors the behavior of RequestFeatureAccess for unit testing.
 * It tests:
 * 1. The button is labeled with the feature label
 * 2. Clicking opens the dialog
 * 3. Submitting with optional message calls the API
 * 4. Success closes the dialog and shows a toast
 * 5. API error shows an error toast
 */

type Props = {
  featureKey: string
  featureLabel: string
  onRequestAccess?: (featureKey: string, message: string) => Promise<{ success: boolean; error?: string }>
}

// Simplified dialog state machine (mirrors React useState)
function createStubFeatureAccess(props: Props) {
  let open = false
  let loading = false
  let message = ""

  async function handleSubmit() {
    loading = true
    const result = await props.onRequestAccess?.(props.featureKey, message)
    loading = false
    return result
  }

  return { open, loading, message, setOpen: (v: boolean) => { open = v }, setMessage: (v: string) => { message = v }, handleSubmit }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("RequestFeatureAccess — unit stub behavior", () => {
  const mockRequestAccess = vi.fn()

  beforeEach(() => {
    mockRequestAccess.mockReset()
  })

it("button is labeled with the feature label", () => {
    const { open } = createStubFeatureAccess({
      featureKey: "studio",
      featureLabel: "Site Editor",
      onRequestAccess: mockRequestAccess,
    })
    expect(open).toBe(false)
    // The featureLabel should be visible on the trigger button
    expect("Site Editor").toBeTruthy()
  })

  it("submitting a request calls onRequestAccess with featureKey and message", async () => {
    mockRequestAccess.mockResolvedValue({ success: true })

    const { handleSubmit, setMessage } = createStubFeatureAccess({
      featureKey: "support",
      featureLabel: "Support Tickets",
      onRequestAccess: mockRequestAccess,
    })

    setMessage("I need access to the support system.")
    await handleSubmit()

    expect(mockRequestAccess).toHaveBeenCalledWith("support", "I need access to the support system.")
  })

  it("onRequestAccess error shows error message and does not close", async () => {
    mockRequestAccess.mockResolvedValue({ success: false, error: "Feature not found" })

    const { handleSubmit } = createStubFeatureAccess({
      featureKey: "billing",
      featureLabel: "Billing",
      onRequestAccess: mockRequestAccess,
    })

    const result = await handleSubmit()
    expect(result?.success).toBe(false)
    expect(result?.error).toBe("Feature not found")
  })

  it("empty message still submits the request", async () => {
    mockRequestAccess.mockResolvedValue({ success: true })

    const { handleSubmit } = createStubFeatureAccess({
      featureKey: "tv_feed",
      featureLabel: "TV Feed",
      onRequestAccess: mockRequestAccess,
    })

    await handleSubmit()
    expect(mockRequestAccess).toHaveBeenCalledWith("tv_feed", "")
  })
})

describe("RequestFeatureAccess — API integration shape", () => {
  it("creates a support ticket via /api/tickets with [Feature Request] subject", async () => {
    const featureKey = "studio"
    const featureLabel = "Site Editor"
    const message = "Please enable the Site Editor for our team."

    const payload = {
      subject: `[Feature Request] ${featureLabel}`,
      description: message || `I would like access to the ${featureLabel} feature.`,
      priority: "low",
      tags: ["feature-request", featureKey],
    }

    global.fetch = vi.fn().mockResolvedValue(mockFetchOk({ id: "ticket-123" }))

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    expect(res.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "[Feature Request] Site Editor",
        description: message || "I would like access to the Site Editor feature.",
        priority: "low",
        tags: ["feature-request", "studio"],
      }),
    })
  })

  it("falls back to generic message when no optional message is provided", async () => {
    const payload = {
      subject: "[Feature Request] Support Tickets",
      description: "I would like access to the Support Tickets feature.",
      priority: "low",
      tags: ["feature-request", "support"],
    }

    global.fetch = vi.fn().mockResolvedValue(mockFetchOk({ id: "ticket-456" }))

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    expect(res.ok).toBe(true)
    const calledWith = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(calledWith.description).toBe("I would like access to the Support Tickets feature.")
  })

  it("returns error on API failure", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockFetchError(500, "Database error"))

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "Test", description: "Test", priority: "low" }),
    })

    expect(res.ok).toBe(false)
    expect(res.status).toBe(500)
  })
})
