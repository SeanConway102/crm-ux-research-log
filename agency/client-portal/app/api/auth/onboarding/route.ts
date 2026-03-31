import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = passwordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    )
  }

  const { password } = parsed.data

  try {
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.portalUser.update({
      where: { id: session.user.id },
      data: {
        password: passwordHash,
        hasCompletedOnboarding: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[onboarding POST]", err)
    return NextResponse.json(
      { error: "Failed to save password" },
      { status: 500 }
    )
  }
}
