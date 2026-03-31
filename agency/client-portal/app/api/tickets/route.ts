import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createCrmTicket } from "@/lib/crm-api"
import { z } from "zod"

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? undefined

  const { getCrmTickets } = await import("@/lib/crm-api")
  const tickets = await getCrmTickets(session.user.tenantId, status)
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  try {
    const ticket = await createCrmTicket(session.user.tenantId, parsed.data)
    return NextResponse.json(ticket, { status: 201 })
  } catch (err) {
    console.error("[tickets POST]", err)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
