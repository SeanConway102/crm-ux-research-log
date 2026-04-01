'use client'

import { useActionState, useRef, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleFeatureFlagAction } from './actions'
import type { FeatureFlagToggleState } from './actions'

type FlagEntry = {
  key: string
  label: string
  description: string | null
  isBeta: boolean
  enabled: boolean
  overrideId: string | null
}

type FeatureFlagToggleProps = {
  flag: FlagEntry
  tenantId: string
}

const initialState: FeatureFlagToggleState = {
  tenantId: '',
  flagKey: '',
  success: false,
}

export function FeatureFlagToggle({ flag, tenantId }: FeatureFlagToggleProps) {
  const formRef = useRef<HTMLFormElement>(null)
  // Track previous state to detect transitions and fire toasts only on change
  const prevStateRef = useRef<FeatureFlagToggleState | null>(null)
  const [state, action, isPending] = useActionState<
    FeatureFlagToggleState,
    FormData
  >(toggleFeatureFlagAction, { ...initialState, tenantId, flagKey: flag.key })

  // Fire toast on state transition (success or error), not on every render
  useEffect(() => {
    const prev = prevStateRef.current
    if (!prev) {
      prevStateRef.current = state
      return
    }

    // Success transition: was not successful → now successful
    if (state.success === true && prev.success !== true) {
      toast.success(`${flag.label} enabled`)
    }

    // Error transition: error appeared in state
    if (state.error && !prev.error) {
      toast.error(state.error)
    }

    prevStateRef.current = state
  }, [state, flag.label])

  // The Switch calls onCheckedChange when clicked. We submit the form programmatically.
  const handleToggle = (newEnabled: boolean) => {
    const form = formRef.current
    if (!form) return
    const enabledInput = form.querySelector<HTMLInputElement>('input[name="enabled"]')
    if (enabledInput) enabledInput.value = String(newEnabled)
    const fd = new FormData(form)
    action(fd)
  }

  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-0">
      {/* Flag info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{flag.label}</span>
          {flag.isBeta && (
            <Badge
              variant="outline"
              className="text-xs border-indigo-200 text-indigo-600 bg-indigo-50"
            >
              Beta
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {flag.description ?? flag.key}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
          {flag.key}
        </p>
      </div>

      {/* Toggle — submits form on change */}
      <form ref={formRef} action={action} className="flex items-center gap-2 shrink-0">
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="flagKey" value={flag.key} />
        <input type="hidden" name="enabled" value={String(flag.enabled)} />
        <Switch
          checked={flag.enabled}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={`${flag.label} — ${flag.enabled ? 'enabled' : 'disabled'}`}
        />
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </form>

      {/* Inline error */}
      {state.error && state.flagKey === flag.key && (
        <p className="text-xs text-red-500 col-span-full mt-1">{state.error}</p>
      )}
    </div>
  )
}

export function FeatureFlagList({
  flags,
  tenantId,
}: {
  flags: FlagEntry[]
  tenantId: string
}) {
  if (flags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No feature flags defined.
      </p>
    )
  }

  return (
    <div className="divide-y">
      {flags.map((flag) => (
        <FeatureFlagToggle key={flag.key} flag={flag} tenantId={tenantId} />
      ))}
    </div>
  )
}
