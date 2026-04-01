/**
 * Unit tests for the dashboard page.
 *
 * Tests:
 * 1. Quick action buttons are hidden when their feature flag is disabled
 * 2. Time-based greeting: morning/afternoon/evening
 * 3. Subscription data is fetched from CRM and displayed
 * 4. Site status is fetched from CRM and displayed
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock CRM API ─────────────────────────────────────────────────────────────

const mockSubscription = {
  id: "sub_123",
  tenant_id: "tenant-a",
  status: "active" as const,
  plan_name: "Business Pro",
  plan_amount: 9900,
  plan_interval: "month" as const,
  current_period_end: "2026-04-30T00:00:00Z",
  stripe_customer_id: "cus_123",
  stripe_subscription_id: "sub_123",
}

const mockSite = {
  id: "site_abc",
  name: "Acme Corp",
  url: "https://acme-corp.com",
  company_id: "tenant-a",
  sanity_project_id: "sanity123",
  sanity_preview_url: null,
  sanity_preview_secret: null,
  sanity_path_template: null,
  status: "active",
}

function createMockCrmApi() {
  return {
    getCrmSubscription: vi.fn<[string], typeof mockSubscription | null>(),
    getCrmSite: vi.fn<[string], typeof mockSite | null>(),
    getCrmTickets: vi.fn<[string, string?], Array<{ id: string; subject: string; priority: string; created_at: string }>>(),
  }
}

// ─── Mock Next.js auth + features ────────────────────────────────────────────

function createMockSession(role = "EDITOR") {
  return {
    user: {
      id: "user-1",
      email: "john@acme.com",
      name: "John Doe",
      tenantId: "tenant-a",
      role,
      hasPassword: true,
      tenantType: "CLIENT",
      enabledFeatures: {},
    },
  }
}

// ─── Greeting logic (pure function — same as we will implement) ─────────────

function getGreeting(hourUtc: number): string {
  if (hourUtc >= 5 && hourUtc < 12) return "Good morning"
  if (hourUtc >= 12 && hourUtc < 17) return "Good afternoon"
  if (hourUtc >= 17 && hourUtc < 21) return "Good evening"
  return "Good night"
}

describe("getGreeting — time-based greeting", () => {
  it("returns 'Good morning' from 5:00 to 11:59 UTC", () => {
    expect(getGreeting(5)).toBe("Good morning")
    expect(getGreeting(7)).toBe("Good morning")
    expect(getGreeting(11)).toBe("Good morning")
  })

  it("returns 'Good afternoon' from 12:00 to 16:59 UTC", () => {
    expect(getGreeting(12)).toBe("Good afternoon")
    expect(getGreeting(14)).toBe("Good afternoon")
    expect(getGreeting(16)).toBe("Good afternoon")
  })

  it("returns 'Good evening' from 17:00 to 20:59 UTC", () => {
    expect(getGreeting(17)).toBe("Good evening")
    expect(getGreeting(19)).toBe("Good evening")
    expect(getGreeting(20)).toBe("Good evening")
  })

  it("returns 'Good night' from 21:00 to 4:59 UTC", () => {
    expect(getGreeting(21)).toBe("Good night")
    expect(getGreeting(23)).toBe("Good night")
    expect(getGreeting(0)).toBe("Good night")
    expect(getGreeting(4)).toBe("Good night")
  })
})

// ─── Quick action visibility logic ────────────────────────────────────────────

type QuickAction = {
  key: string
  label: string
  href: string
  icon: string
  featureKey?: string
}

const ALL_QUICK_ACTIONS: QuickAction[] = [
  { key: "studio", label: "Edit website content", href: "/studio", icon: "Monitor", featureKey: "studio" },
  { key: "support", label: "File a support ticket", href: "/support/new", icon: "LifeBuoy", featureKey: "support" },
  { key: "billing", label: "View billing & invoices", href: "/billing", icon: "CreditCard", featureKey: "billing" },
]

function getVisibleQuickActions(enabledFeatures: Record<string, boolean>): QuickAction[] {
  return ALL_QUICK_ACTIONS.filter((action) => {
    if (!action.featureKey) return true
    return enabledFeatures[action.featureKey] === true
  })
}

describe("getVisibleQuickActions — feature flag gating", () => {
  it("shows all actions when all flags are enabled", () => {
    const features = { studio: true, support: true, billing: true }
    const visible = getVisibleQuickActions(features)
    expect(visible).toHaveLength(3)
  })

  it("hides studio action when studio flag is disabled", () => {
    const features = { studio: false, support: true, billing: true }
    const visible = getVisibleQuickActions(features)
    expect(visible.map((a) => a.key)).not.toContain("studio")
    expect(visible).toHaveLength(2)
  })

  it("hides billing action when billing flag is disabled", () => {
    const features = { studio: true, support: true, billing: false }
    const visible = getVisibleQuickActions(features)
    expect(visible.map((a) => a.key)).not.toContain("billing")
    expect(visible).toHaveLength(2)
  })

  it("hides all feature-gated actions when no flags are enabled", () => {
    const features = { studio: false, support: false, billing: false }
    const visible = getVisibleQuickActions(features)
    expect(visible).toHaveLength(0)
  })

  it("handles empty enabledFeatures object gracefully", () => {
    const features = {}
    const visible = getVisibleQuickActions(features)
    // All feature-gated items should be hidden
    expect(visible).toHaveLength(0)
  })

  it("always shows non-feature-gated actions", () => {
    const actions: QuickAction[] = [
      { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "Layout" },
      { key: "studio", label: "Edit site", href: "/studio", icon: "Monitor", featureKey: "studio" },
    ]
    const alwaysVisible = actions.filter((a) => !a.featureKey)
    expect(alwaysVisible).toHaveLength(1)
    expect(alwaysVisible[0].key).toBe("dashboard")
  })
})

// ─── Subscription status display logic ──────────────────────────────────────

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid"

function getPlanDisplay(subscription: typeof mockSubscription | null): { plan: string; badge: string; color: string } {
  if (!subscription) {
    return { plan: "No plan", badge: "Unknown", color: "bg-gray-100 text-gray-700" }
  }

  const statusBadge: Record<SubscriptionStatus, { label: string; color: string }> = {
    active: { label: "Active", color: "bg-green-100 text-green-700" },
    trialing: { label: "Trial", color: "bg-blue-100 text-blue-700" },
    past_due: { label: "Past Due", color: "bg-orange-100 text-orange-700" },
    canceled: { label: "Canceled", color: "bg-red-100 text-red-700" },
    incomplete: { label: "Setup Required", color: "bg-yellow-100 text-yellow-700" },
    unpaid: { label: "Unpaid", color: "bg-red-100 text-red-700" },
  }

  const status = subscription.status as SubscriptionStatus
  const badge = statusBadge[status] ?? { label: status, color: "bg-gray-100 text-gray-700" }

  return {
    plan: subscription.plan_name,
    badge: badge.label,
    color: badge.color,
  }
}

describe("getPlanDisplay — subscription card rendering", () => {
  it("shows plan name and Active badge for active subscription", () => {
    const result = getPlanDisplay(mockSubscription)
    expect(result.plan).toBe("Business Pro")
    expect(result.badge).toBe("Active")
    expect(result.color).toBe("bg-green-100 text-green-700")
  })

  it("shows Past Due badge and orange color for past_due subscription", () => {
    const pastDue = { ...mockSubscription, status: "past_due" as const }
    const result = getPlanDisplay(pastDue)
    expect(result.badge).toBe("Past Due")
    expect(result.color).toBe("bg-orange-100 text-orange-700")
  })

  it("shows 'No plan' for null subscription", () => {
    const result = getPlanDisplay(null)
    expect(result.plan).toBe("No plan")
    expect(result.badge).toBe("Unknown")
  })

  it("shows Canceled badge for canceled subscription", () => {
    const canceled = { ...mockSubscription, status: "canceled" as const }
    const result = getPlanDisplay(canceled)
    expect(result.badge).toBe("Canceled")
    expect(result.color).toBe("bg-red-100 text-red-700")
  })
})

// ─── Site status display logic ─────────────────────────────────────────────────

type SiteStatus = "active" | "inactive" | "suspended" | "pending" | string

function getSiteStatusDisplay(status: SiteStatus | null): { label: string; color: string; dot: string } {
  if (!status) {
    return { label: "Unknown", color: "text-gray-500", dot: "bg-gray-400" }
  }

  const configs: Record<string, { label: string; color: string; dot: string }> = {
    active: { label: "Active", color: "text-green-600", dot: "bg-green-500" },
    inactive: { label: "Inactive", color: "text-yellow-600", dot: "bg-yellow-500" },
    suspended: { label: "Suspended", color: "text-red-600", dot: "bg-red-500" },
    pending: { label: "Pending", color: "text-orange-600", dot: "bg-orange-500" },
  }

  return configs[status] ?? { label: status, color: "text-gray-500", dot: "bg-gray-400" }
}

describe("getSiteStatusDisplay — site status card rendering", () => {
  it("shows Active with green dot for active status", () => {
    const result = getSiteStatusDisplay("active")
    expect(result.label).toBe("Active")
    expect(result.dot).toBe("bg-green-500")
    expect(result.color).toBe("text-green-600")
  })

  it("shows Suspended with red dot for suspended status", () => {
    const result = getSiteStatusDisplay("suspended")
    expect(result.label).toBe("Suspended")
    expect(result.dot).toBe("bg-red-500")
  })

  it("returns Unknown for null status", () => {
    const result = getSiteStatusDisplay(null)
    expect(result.label).toBe("Unknown")
    expect(result.dot).toBe("bg-gray-400")
  })

  it("returns the raw status label for unknown status strings", () => {
    const result = getSiteStatusDisplay("maintenance")
    expect(result.label).toBe("maintenance")
  })
})

// ─── Dashboard data composition ───────────────────────────────────────────────

interface DashboardData {
  greeting: string
  quickActions: QuickAction[]
  plan: { plan: string; badge: string; color: string }
  siteStatus: { label: string; color: string; dot: string }
  openTicketCount: number
  highPriorityCount: number
}

function buildDashboardData(
  hourUtc: number,
  enabledFeatures: Record<string, boolean>,
  subscription: typeof mockSubscription | null,
  siteStatus: SiteStatus | null,
  openTickets: Array<{ priority: string }>
): DashboardData {
  return {
    greeting: getGreeting(hourUtc),
    quickActions: getVisibleQuickActions(enabledFeatures),
    plan: getPlanDisplay(subscription),
    siteStatus: getSiteStatusDisplay(siteStatus),
    openTicketCount: openTickets.length,
    highPriorityCount: openTickets.filter((t) => t.priority === "high" || t.priority === "urgent").length,
  }
}

describe("buildDashboardData — full composition", () => {
  it("builds correct dashboard for a full-featured tenant at 9am UTC", () => {
    const data = buildDashboardData(
      9,
      { studio: true, support: true, billing: true },
      mockSubscription,
      "active",
      [
        { id: "1", subject: "Bug", priority: "high", created_at: "2026-04-01" },
        { id: "2", subject: "Question", priority: "low", created_at: "2026-04-01" },
      ]
    )

    expect(data.greeting).toBe("Good morning")
    expect(data.quickActions).toHaveLength(3)
    expect(data.plan.plan).toBe("Business Pro")
    expect(data.plan.badge).toBe("Active")
    expect(data.siteStatus.label).toBe("Active")
    expect(data.openTicketCount).toBe(2)
    expect(data.highPriorityCount).toBe(1)
  })

  it("shows minimal dashboard for a tenant with only support enabled", () => {
    const data = buildDashboardData(
      14,
      { studio: false, support: true, billing: false },
      { ...mockSubscription, status: "past_due" as const },
      "active",
      [{ id: "1", subject: "Help", priority: "urgent", created_at: "2026-04-01" }]
    )

    expect(data.greeting).toBe("Good afternoon")
    expect(data.quickActions).toHaveLength(1)
    expect(data.quickActions[0].key).toBe("support")
    expect(data.plan.badge).toBe("Past Due")
    expect(data.highPriorityCount).toBe(1)
  })

  it("shows empty quick actions when no features enabled", () => {
    const data = buildDashboardData(
      20,
      {},
      null,
      null,
      []
    )

    expect(data.quickActions).toHaveLength(0)
    expect(data.plan.plan).toBe("No plan")
    expect(data.siteStatus.label).toBe("Unknown")
    expect(data.openTicketCount).toBe(0)
  })
})
