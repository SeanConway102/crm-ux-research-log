"use client"

import { useEffect, useRef, useState } from "react"
import { useActionState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toggleFeatureFlagAction, type ToggleFeatureFlagState } from "@/app/actions"
import { type FEATURE_FLAGS } from "@/lib/features"

type FeatureKey = keyof typeof FEATURE_FLAGS

type FeatureFlagEntry = {
  key: string
  label: string
  description: string | null
  isBeta: boolean
  enabled: boolean
  overrideId: string | null
}

type FeatureFlagToggleProps = {
  flag: FeatureFlagEntry
  tenantId: string
}

/**
 * Single feature flag toggle row.
 *
 * Uses useActionState to track pending/success/error from the server action.
 * Fires a toast notification on state transitions (success → confirm, error → alert).
 *
 * The Switch reflects optimistic state — it flips immediately on click,
 * and reverts if the server action returns an error.
 */
export function FeatureFlagToggle({ flag, tenantId }: FeatureFlagToggleProps) {
  const { update } = useSession()

  const initialState: ToggleFeatureFlagState = {
    tenantId,
    flagKey: flag.key,
    success: undefined,
    error: undefined,
  }

  // useActionState: first arg is the action, second is the initial state
  const [state, formAction, isPending] = useActionState(
    toggleFeatureFlagAction,
    initialState
  )

  // Track previous success state to detect transitions
  // Track the last "outcome" to detect state transitions
  // "pending" = action in flight or not yet resolved, "success" | "error" = resolved
  const prevOutcomeRef = useRef<"success" | "error" | undefined>(undefined)
  const [optimisticEnabled, setOptimisticEnabled] = useState(flag.enabled)

  // Sync optimistic state if server result differs (e.g., after revalidation)
  useEffect(() => {
    if (state.success !== undefined) {
      // Action resolved — revert optimistic to server truth
      setOptimisticEnabled(flag.enabled)
      prevOutcomeRef.current = state.success ? "success" : "error"
    }
  }, [flag.enabled, state.success])

  // Fire toast + refresh session on state transitions
  useEffect(() => {
    if (state.success === true && prevOutcomeRef.current !== "success") {
      toast.success(`${flag.label} ${optimisticEnabled ? "enabled" : "disabled"}`)
      // Force NextAuth to re-call jwt() callback → embeds fresh enabledFeatures into JWT.
      // This ensures the admin sees the feature appear/disappear from their own sidebar
      // immediately, instead of waiting up to 5 minutes for the next periodic refresh.
      update()
      prevOutcomeRef.current = "success"
    }
    if (state.error && prevOutcomeRef.current !== "error") {
      toast.error(state.error)
      // Revert optimistic state on error
      setOptimisticEnabled(flag.enabled)
      prevOutcomeRef.current = "error"
    }
  }, [state.success, state.error, flag.label, optimisticEnabled, flag.enabled, update])

  function handleToggle(checked: boolean) {
    setOptimisticEnabled(checked)
    prevOutcomeRef.current = undefined // reset so transition fires on next resolution

    const fd = new FormData()
    fd.append("tenantId", tenantId)
    fd.append("flagKey", flag.key)
    fd.append("enabled", String(checked))
    formAction(fd)
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{flag.label}</span>
          {flag.isBeta && (
            <Badge variant="outline" className="text-xs font-normal bg-amber-50 text-amber-700 border-amber-200">
              Beta
            </Badge>
          )}
        </div>
        {flag.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{flag.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 pt-0.5">
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Saving…
          </span>
        )}
        <Switch
          checked={optimisticEnabled}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={`Toggle ${flag.label}`}
        />
      </div>
    </div>
  )
}
