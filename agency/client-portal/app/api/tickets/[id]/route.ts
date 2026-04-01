import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCrmTicket, getCrmTicketComments, createCrmTicketComment } from "@/lib/crm-api"
import { z } from "zod"

const commentSchema = z.object({
  body: z.string().min(1).max(5000),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const [ticket, comments] = await Promise.all([
    getCrmTicket(id),
    getCrmTicketComments(id),
  ])

  // Strip internal notes — clients must never see agent internal comments
  const publicComments = (comments ?? []).filter((c) => !c.is_internal)

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  // Ensure the ticket belongs to the authenticated tenant
  if (ticket.tenant_id !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ ticket, comments: publicComments })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Verify the ticket exists and belongs to this tenant
  const ticket = await getCrmTicket(id)
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }
  if (ticket.tenant_id !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  try {
    const comment = await createCrmTicketComment(id, {
      body: parsed.data.body,
      author_name: session.user.name ?? "Portal User",
      author_email: session.user.email,
    })
    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error("[tickets/:id/comments POST]", err)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
