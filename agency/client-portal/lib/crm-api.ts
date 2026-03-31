/**
 * CRM API client — server-side only.
 * All methods return data from the CRM; the portal never owns this data.
 */

const CRM_BASE = process.env.CRM_API_URL!
const CRM_KEY = process.env.CRM_API_KEY!

async function crmFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CRM_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CRM_KEY}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`CRM API error ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface CrmSite {
  id: string
  name: string
  url: string
  company_id: string | null
  sanity_project_id: string | null
  sanity_preview_url: string | null
  sanity_preview_secret: string | null
  sanity_path_template: string | null
  status: string
}

export interface CrmUser {
  id: string
  email: string
  name: string | null
  tenant_id: string
  role: string
  has_password: boolean
}

export interface CrmSubscription {
  id: string
  tenant_id: string
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid"
  plan_name: string
  plan_amount: number
  plan_interval: "month" | "year"
  current_period_end: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export interface CrmInvoice {
  id: string
  tenant_id: string
  number: string
  amount: number
  status: "paid" | "open" | "void" | "uncollectible"
  created: string
  due_date: string | null
  pdf_url: string | null
}

export interface CrmTicket {
  id: string
  tenant_id: string
  subject: string
  description: string | null
  status: string
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
  assignee_id: string | null
}

// ── Methods ───────────────────────────────────────────────────────────────────

export async function getCrmSite(siteId: string): Promise<CrmSite | null> {
  try {
    return await crmFetch<CrmSite>(`/sites/${siteId}`)
  } catch {
    return null
  }
}

export async function getCrmUserByEmail(
  email: string
): Promise<CrmUser | null> {
  try {
    const users = await crmFetch<CrmUser[]>(`/users?email=${encodeURIComponent(email)}`)
    return users[0] ?? null
  } catch {
    return null
  }
}

export async function getCrmSubscription(
  tenantId: string
): Promise<CrmSubscription | null> {
  try {
    return await crmFetch<CrmSubscription>(
      `/tenants/${tenantId}/subscription`
    )
  } catch {
    return null
  }
}

export async function getCrmInvoices(
  tenantId: string
): Promise<CrmInvoice[]> {
  try {
    return await crmFetch<CrmInvoice[]>(`/tenants/${tenantId}/invoices`)
  } catch {
    return []
  }
}

export async function getCrmTickets(
  tenantId: string,
  status?: string
): Promise<CrmTicket[]> {
  const params = status ? `?status=${status}` : ""
  try {
    return await crmFetch<CrmTicket[]>(`/tenants/${tenantId}/tickets${params}`)
  } catch {
    return []
  }
}

export async function createCrmTicket(
  tenantId: string,
  payload: {
    subject: string
    description: string
    priority: CrmTicket["priority"]
  }
): Promise<CrmTicket> {
  return crmFetch<CrmTicket>(`/tenants/${tenantId}/tickets`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function forwardStripeEvent(
  event: Record<string, unknown>
): Promise<void> {
  await crmFetch("/webhooks/stripe", {
    method: "POST",
    body: JSON.stringify(event),
  })
}
