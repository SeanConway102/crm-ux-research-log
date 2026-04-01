/**
 * app/(portal)/settings/page.tsx
 *
 * User settings page — profile and security.
 * Requires authentication. Redirects to /login if unauthenticated.
 *
 * The sidebar links to /settings for all authenticated portal users.
 * OWNER and EDITOR roles can update their profile and password.
 * BILLING and SUPPORT roles can also update profile/password.
 *
 * @see SPEC.md Phase 6 — polish
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Settings2 } from "lucide-react"
import { SettingsForm } from "./settings-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings — Client Portal",
  description: "Manage your profile and security settings",
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch current user data from portal DB (not CRM)
  const user = await prisma.portalUser.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Settings2 className="h-4 w-4" />
          <span className="text-sm font-medium">Account</span>
        </div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile information and security settings.
        </p>
      </div>

      <SettingsForm name={user?.name} email={user?.email} />
    </div>
  )
}
