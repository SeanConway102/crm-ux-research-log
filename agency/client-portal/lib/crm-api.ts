/**
 * CRM API client — server-side only via MCP.
 * All methods return data from the CRM; the portal never owns this data.
 */

const CRM_BASE = process.env.CRM_API_URL ?? "https://crm-api-1016182607730.us-east1.run.app"
const CRM_KEY = process.env.CRM_API_KEY!

const MCP_ENDPOINT = `${CRM_BASE}/mcp`

let _mcpSession: string | null = null

// ── MCP low-level client ─────────────────────────────────────────────────────

interface McpContentBlock {
  type: "text"
  text: string
}

interface McpToolResult {
  content: McpContentBlock[]
  isError?: boolean
}

async function mcpCall(tool: string, args: Record<string, unknown>): Promise<unknown> {
  // Initialize session if needed
  if (!_mcpSession) {
    const initRes = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: {
        "X-API-Key": CRM_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "portal-client", version: "1.0" },
        },
      }),
    })
    const initData = await initRes.json()
    if (initData.error) {
      throw new Error(`MCP init error: ${initData.error.message}`)
    }
    // Capture session cookie if provided
    _mcpSession = initRes.headers.get("mcpm-session") ?? "initialized"
  }

  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-Key": CRM_KEY,
      "Content-Type": "application/json",
      ...(_mcpSession && _mcpSession !== "initialized"
        ? { "mcpm-session": _mcpSession }
        : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 99999),
      method: "tools/call",
      params: {
        name: tool,
        arguments: args,
      },
    }),
  })

  const data = await res.json()
  if (data.error) {
    throw new Error(`MCP error calling ${tool}: ${data.error.message}`)
  }
  const result = data.result as McpToolResult
  if (result.isError) {
    throw new Error(`MCP tool error (${tool}): ${result.content[0]?.text}`)
  }
  // Parse the JSON text inside the content block
  return JSON.parse(result.content[0].text)
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface CrmTicket {
  id: string
  tenant_id: string
  subject: string
  description: string | null
  status: string
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
  assignee_id?: string | null
  assignee?: { id: string; email: string; first_name: string; last_name: string } | null
  category?: string | null
  pipeline_id?: string
  stage_id?: string
  custom_fields?: Record<string, unknown>
  assigned_to?: string | null
}

export interface CrmComment {
  id: string
  ticket_id: string
  author_name: string
  author_email: string
  body: string
  is_internal: boolean
  created_at: string
}

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

// ── Portal status → CRM status mapping ────────────────────────────────────────

// The portal UI uses "open", "in_progress", "resolved", "closed"
// but the CRM uses "Backlog", "In Progress", "Done", "Closed", etc.
const PORTAL_TO_CRM_STATUS: Record<string, string> = {
  open: "Backlog,In Progress,Open",
  in_progress: "In Progress",
  resolved: "Done,Resolved",
  closed: "Closed",
}

/** Convert portal-side status filter to CRM filter, returns undefined if no match */
function translateStatusFilter(status?: string): string | undefined {
  if (!status) return undefined
  const crmStatus = PORTAL_TO_CRM_STATUS[status]
  if (!crmStatus) return undefined
  // MCP list_entities status filter appears to accept comma-separated values
  return crmStatus
}

// ── Methods ───────────────────────────────────────────────────────────────────

export async function getCrmSite(siteId: string): Promise<CrmSite | null> {
  try {
    const data = (await mcpCall("get_site", { id: siteId })) as CrmSite
    return data
  } catch {
    return null
  }
}

export async function getCrmUserByEmail(
  email: string
): Promise<CrmUser | null> {
  try {
    const data = (await mcpCall("search", {
      query: email,
      entity_types: "contact",
      limit: 1,
    })) as { data: unknown[] }
    if (!data.data?.[0]) return null
    const contact = data.data[0] as { user?: CrmUser }
    return contact.user ?? null
  } catch {
    return null
  }
}

export async function getCrmSubscription(
  tenantId: string
): Promise<CrmSubscription | null> {
  try {
    // MCP doesn't have a direct "get subscription by tenant" — use search
    const data = (await mcpCall("search", {
      query: "",
      entity_types: "subscription",
      limit: 1,
    })) as { data: CrmSubscription[] }
    return data.data?.find((s) => s.tenant_id === tenantId) ?? null
  } catch {
    return null
  }
}

export async function getCrmInvoices(
  tenantId: string
): Promise<CrmInvoice[]> {
  try {
    const data = (await mcpCall("list_entities", {
      entity_type: "invoice",
      filters: JSON.stringify({ company_id: tenantId }),
    })) as { data: CrmInvoice[]; has_more: boolean }
    return data.data ?? []
  } catch {
    return []
  }
}

export async function getCrmTickets(
  tenantId: string,
  status?: string
): Promise<CrmTicket[]> {
  try {
    const filters: Record<string, string> = { tenant_id: tenantId }
    const crmStatus = translateStatusFilter(status)
    if (crmStatus) filters.status = crmStatus

    const data = (await mcpCall("list_entities", {
      entity_type: "ticket",
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
      limit: 100,
    })) as { data: CrmTicket[]; has_more: boolean }

    return data.data ?? []
  } catch (err) {
    console.error("[crm-api] getCrmTickets failed:", err)
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
  return (await mcpCall("create_ticket", {
    subject: payload.subject,
    description: payload.description,
    priority: payload.priority,
    source: "portal",
  })) as CrmTicket
}

export async function getCrmTicket(ticketId: string): Promise<CrmTicket | null> {
  try {
    return (await mcpCall("get_ticket", { id: ticketId })) as CrmTicket
  } catch {
    return null
  }
}

export async function getCrmTicketComments(
  ticketId: string
): Promise<CrmComment[]> {
  try {
    const data = (await mcpCall("list_comments", {
      entity_type: "ticket",
      entity_id: ticketId,
      limit: 50,
    })) as { data: CrmComment[]; has_more: boolean }
    return data.data ?? []
  } catch {
    return []
  }
}

export async function createCrmTicketComment(
  ticketId: string,
  payload: { body: string; author_name: string; author_email: string }
): Promise<CrmComment> {
  return (await mcpCall("create_comment", {
    entity_type: "ticket",
    entity_id: ticketId,
    body: payload.body,
  })) as CrmComment
}

export async function forwardStripeEvent(
  event: Record<string, unknown>
): Promise<void> {
  // Stripe events are forwarded via the webhook endpoint (not MCP)
  await fetch(`${CRM_BASE}/webhooks/stripe`, {
    method: "POST",
    headers: {
      "X-API-Key": CRM_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  })
}
