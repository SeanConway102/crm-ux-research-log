import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as createComment } from "../../../../../app/api/tickets/[id]/route"
import { GET as getTicketAndComments } from "../../../../../app/api/tickets/[id]/route"
import type { NextRequest } from "next/server"

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock NextAuth auth() — must be before importing the route module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// Mock the CRM API functions
vi.mock("@/lib/crm-api", () => ({
  getCrmTicket: vi.fn(),
  getCrmTicketComments: vi.fn(),
  createCrmTicketComment: vi.fn(),
}))

import { auth } from "@/lib/auth"
import { getCrmTicket, getCrmTicketComments, createCrmTicketComment } from "@/lib/crm-api"

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetCrmTicket = getCrmTicket as ReturnType<typeof vi.fn>
const mockGetCrmTicketComments = getCrmTicketComments as ReturnType<typeof vi.fn>
const mockCreateCrmTicketComment = createCrmTicketComment as ReturnType<typeof vi.fn>

function makeRequest(method: string, body?: unknown, params?: { id: string }): NextRequest {
  const url = `https://portal.example.com/api/tickets/${params?.id ?? "ticket-123"}`
  return {
    method,
    url,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body as Record<string, unknown>,
    text: async () => JSON.stringify(body),
  } as unknown as NextRequest
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/tickets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: { id: "user-1", tenantId: "tenant-abc", email: "test@example.com", role: "OWNER", hasPassword: true, tenantType: "CLIENT", name: "Test User" },
    })
  })

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)

    const req = makeRequest("GET", undefined, { id: "ticket-123" })
    const res = await getTicketAndComments(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(401)
  })

  it("returns 404 when ticket does not exist", async () => {
    mockGetCrmTicket.mockResolvedValueOnce(null)

    const req = makeRequest("GET", undefined, { id: "ticket-404" })
    const res = await getTicketAndComments(req, { params: Promise.resolve({ id: "ticket-404" }) })

    expect(res.status).toBe(404)
  })

  it("returns 403 when ticket belongs to a different tenant", async () => {
    mockGetCrmTicket.mockResolvedValueOnce({
      id: "ticket-123",
      tenant_id: "other-tenant",
      subject: "Test",
      description: null,
      status: "open",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignee_id: null,
    })

    const req = makeRequest("GET", undefined, { id: "ticket-123" })
    const res = await getTicketAndComments(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(403)
  })

  it("returns ticket and comments for valid request", async () => {
    const mockTicket = {
      id: "ticket-123",
      tenant_id: "tenant-abc",
      subject: "Login issue",
      description: "Cannot log in",
      status: "open",
      priority: "high" as const,
      created_at: "2026-03-31T10:00:00Z",
      updated_at: "2026-03-31T10:00:00Z",
      assignee_id: null,
    }
    const mockComments = [
      {
        id: "comment-1",
        ticket_id: "ticket-123",
        author_name: "Agent Smith",
        author_email: "agent@ctwebsiteco.com",
        body: "Looking into this now.",
        is_internal: false,
        created_at: "2026-03-31T11:00:00Z",
      },
    ]

    mockGetCrmTicket.mockResolvedValueOnce(mockTicket)
    mockGetCrmTicketComments.mockResolvedValueOnce(mockComments)

    const req = makeRequest("GET", undefined, { id: "ticket-123" })
    const res = await getTicketAndComments(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(200)
    const json = await (res as unknown as { json(): Promise<{ ticket: unknown; comments: unknown[] }> }).json()
    expect(json.ticket).toMatchObject({ id: "ticket-123", subject: "Login issue" })
    expect(json.comments).toHaveLength(1)
    expect(json.comments[0]).toMatchObject({ body: "Looking into this now." })
  })
})

describe("POST /api/tickets/[id] (add comment)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: { id: "user-1", tenantId: "tenant-abc", email: "test@example.com", role: "OWNER", hasPassword: true, tenantType: "CLIENT", name: "Test User" },
    })
  })

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)

    const req = makeRequest("POST", { body: "Test reply" }, { id: "ticket-123" })
    const res = await createComment(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(401)
  })

  it("returns 404 when ticket does not exist", async () => {
    mockGetCrmTicket.mockResolvedValueOnce(null)

    const req = makeRequest("POST", { body: "Test reply" }, { id: "ticket-404" })
    const res = await createComment(req, { params: Promise.resolve({ id: "ticket-404" }) })

    expect(res.status).toBe(404)
  })

  it("returns 403 when ticket belongs to a different tenant", async () => {
    mockGetCrmTicket.mockResolvedValueOnce({
      id: "ticket-123",
      tenant_id: "other-tenant",
      subject: "Test",
      description: null,
      status: "open",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignee_id: null,
    })

    const req = makeRequest("POST", { body: "Test reply" }, { id: "ticket-123" })
    const res = await createComment(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(403)
  })

  it("returns 422 when body is empty", async () => {
    mockGetCrmTicket.mockResolvedValueOnce({
      id: "ticket-123",
      tenant_id: "tenant-abc",
      subject: "Test",
      description: null,
      status: "open",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignee_id: null,
    })

    const req = makeRequest("POST", { body: "" }, { id: "ticket-123" })
    const res = await createComment(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(422)
  })

  it("returns 201 and the created comment on success", async () => {
    const mockTicket = {
      id: "ticket-123",
      tenant_id: "tenant-abc",
      subject: "Test",
      description: null,
      status: "open",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignee_id: null,
    }
    const mockComment = {
      id: "comment-new",
      ticket_id: "ticket-123",
      author_name: "Test User",
      author_email: "test@example.com",
      body: "This is my reply.",
      is_internal: false,
      created_at: new Date().toISOString(),
    }

    mockGetCrmTicket.mockResolvedValueOnce(mockTicket)
    mockCreateCrmTicketComment.mockResolvedValueOnce(mockComment)

    const req = makeRequest("POST", { body: "This is my reply." }, { id: "ticket-123" })
    const res = await createComment(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(201)
    const json = await (res as unknown as { json(): Promise<unknown> }).json()
    expect(json).toMatchObject({ id: "comment-new", body: "This is my reply." })
    expect(mockCreateCrmTicketComment).toHaveBeenCalledWith(
      "ticket-123",
      expect.objectContaining({ body: "This is my reply." })
    )
  })

  it("returns 500 when CRM API throws", async () => {
    mockGetCrmTicket.mockResolvedValueOnce({
      id: "ticket-123",
      tenant_id: "tenant-abc",
      subject: "Test",
      description: null,
      status: "open",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignee_id: null,
    })
    mockCreateCrmTicketComment.mockRejectedValueOnce(new Error("CRM down"))

    const req = makeRequest("POST", { body: "Test reply" }, { id: "ticket-123" })
    const res = await createComment(req, { params: Promise.resolve({ id: "ticket-123" }) })

    expect(res.status).toBe(500)
  })
})
