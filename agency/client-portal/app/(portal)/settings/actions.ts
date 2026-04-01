/**
 * app/(portal)/settings/actions.ts
 *
 * Server actions for the /settings page.
 * - updateProfileAction: update name + email
 * - updatePasswordAction: change password (requires current password verification)
 */

"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { z } from "zod"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProfileState = {
  errors?: {
    name?: string[]
    email?: string[]
    root?: string[]
  }
  success?: string
}

export type PasswordState = {
  errors?: {
    currentPassword?: string[]
    newPassword?: string[]
    confirmPassword?: string[]
    root?: string[]
  }
  success?: string
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
  })

// ─── updateProfileAction ─────────────────────────────────────────────────────

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const name = formData.get("name") as string
  const email = (formData.get("email") as string)?.trim().toLowerCase()

  const parsed = profileSchema.safeParse({ name, email })
  if (!parsed.success) {
    return {
      errors: {
        name: parsed.error.issues
          .filter((e) => e.path.join(".") === "name")
          .map((e) => e.message),
        email: parsed.error.issues
          .filter((e) => e.path.join(".") === "email")
          .map((e) => e.message),
      },
    }
  }

  // Check email uniqueness within this tenant
  const existing = await prisma.portalUser.findFirst({
    where: {
      email,
      tenantId: session.user.tenantId,
      NOT: { id: session.user.id },
    },
  })

  if (existing) {
    return {
      errors: {
        email: ["This email is already in use by another user in your portal"],
      },
    }
  }

  await prisma.portalUser.update({
    where: { id: session.user.id },
    data: { name: name.trim(), email },
  })

  revalidatePath("/settings")
  return { success: "Profile updated successfully" }
}

// ─── updatePasswordAction ─────────────────────────────────────────────────────

export async function updatePasswordAction(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  const parsed = passwordSchema.safeParse({ currentPassword, newPassword, confirmPassword })
  if (!parsed.success) {
    const errors: PasswordState["errors"] = {}
    for (const issue of parsed.error.issues) {
      // issue.path[issue.path.length - 1] gives the field name
      const key = issue.path[issue.path.length - 1] as string
      if (key && key !== "_offset" && key !== "_root") {
        ;(errors as Record<string, string[]>)[key] ??= []
        ;((errors as Record<string, string[]>)[key] as string[]).push(issue.message)
      }
    }
    return { errors }
  }

  // Fetch user with password hash
  const user = await prisma.portalUser.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user?.password) {
    return { errors: { root: ["User not found"] } }
  }

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return { errors: { currentPassword: ["Current password is incorrect"] } }
  }

  // Hash and save new password
  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.portalUser.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  revalidatePath("/settings")
  return { success: "Password updated successfully" }
}
