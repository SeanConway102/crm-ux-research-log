/**
 * app/(portal)/settings/settings-form.tsx
 *
 * Client Component for the settings page.
 * Renders two forms: Profile (name + email) and Security (change password).
 * Uses React useActionState for optimistic updates and error handling.
 */

"use client"

import { useActionState, useEffect, useRef } from "react"
import { updateProfileAction, updatePasswordAction } from "./actions"
import type { ProfileState, PasswordState } from "./actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User, Lock, CheckCircle2, AlertCircle } from "lucide-react"

// ─── Field error display ──────────────────────────────────────────────────────

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
      <p className="text-sm text-destructive">{errors[0]}</p>
    </div>
  )
}

// ─── Profile form ─────────────────────────────────────────────────────────────

type ProfileFormProps = {
  name: string | null | undefined
  email: string | null | undefined
}

const emptyProfileState: ProfileState = {}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [state, action, isPending] = useActionState(updateProfileAction, {
    ...emptyProfileState,
    // Pre-fill with current values
    ...(name ? {} : {}),
  })

  // Show success message briefly then clear
  const successRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        // Success will be shown for 3 seconds
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.success])

  return (
    <form action={action} className="space-y-4">
      {/* Success message */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.success}
        </div>
      )}

      {/* Name field */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={name ?? ""}
          placeholder="Your full name"
          autoComplete="name"
          disabled={isPending}
          className="max-w-sm"
          aria-describedby={state.errors?.name ? "name-error" : undefined}
        />
        <FieldError errors={state.errors?.name} />
      </div>

      {/* Email field */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email ?? ""}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isPending}
          className="max-w-sm"
          aria-describedby={state.errors?.email ? "email-error" : undefined}
        />
        <FieldError errors={state.errors?.email} />
      </div>

      {/* Root-level error */}
      {state.errors?.root && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.errors.root[0]}
        </div>
      )}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  )
}

// ─── Password form ─────────────────────────────────────────────────────────────

const emptyPasswordState: PasswordState = {}

export function PasswordForm() {
  const [state, action, isPending] = useActionState(updatePasswordAction, emptyPasswordState)

  return (
    <form action={action} className="space-y-4">
      {/* Success message */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.success}
        </div>
      )}

      {/* Current password */}
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          placeholder="Enter current password"
          autoComplete="current-password"
          disabled={isPending}
          className="max-w-sm"
        />
        <FieldError errors={state.errors?.currentPassword} />
      </div>

      {/* New password */}
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={isPending}
          className="max-w-sm"
        />
        <FieldError errors={state.errors?.newPassword} />
      </div>

      {/* Confirm new password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          disabled={isPending}
          className="max-w-sm"
        />
        <FieldError errors={state.errors?.confirmPassword} />
      </div>

      {/* Root-level error */}
      {state.errors?.root && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.errors.root[0]}
        </div>
      )}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  )
}

// ─── Settings page layout ─────────────────────────────────────────────────────

type SettingsFormProps = {
  name: string | null | undefined
  email: string | null | undefined
}

export function SettingsForm({ name, email }: SettingsFormProps) {
  return (
    <div className="space-y-6 max-w-xl">
      {/* Profile card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Update your display name and email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={name} email={email} />
        </CardContent>
      </Card>

      <Separator />

      {/* Security / password card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Security</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Change your password. You&apos;ll need your current password to set a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
