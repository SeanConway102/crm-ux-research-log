"use client"

import { useState, useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { updateFeatureFlagAction } from "./actions"
import { cn } from "@/lib/utils"
import { Loader2, Sparkles, AlertTriangle } from "lucide-react"

type FeatureFlagItem = {
  key: string
  label: string
  description: string | null
  isBeta: boolean
  enabled: boolean
  overrideId: string | null
}

type Props = {
  tenantId: string
  featureFlags: FeatureFlagItem[]
}

export function FeatureFlagToggles({ tenantId, featureFlags }: Props) {
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleToggle(flag: FeatureFlagItem) {
    setError(null)
    setPendingKey(flag.key)

    startTransition(async () => {
      const result = await updateFeatureFlagAction(tenantId, flag.key, !flag.enabled)
      if (!result.success) {
        setError(result.error ?? "Failed to update")
      }
      setPendingKey(null)
    })
  }

  const stableFlags = featureFlags
  const stable = stableFlags // no-op to avoid keyed fragment issue

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="divide-y">
        {stable.map((flag) => {
          const isLoading = pendingKey === flag.key
          return (
            <div
              key={flag.key}
              className="flex items-start justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-3 pr-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{flag.label}</p>
                    {flag.isBeta && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        <Sparkles className="h-2.5 w-2.5" />
                        Beta
                      </span>
                    )}
                  </div>
                  {flag.description && (
                    <p className="mt-0.5 text-sm text-gray-500">{flag.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                {isLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                )}
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => handleToggle(flag)}
                  disabled={isLoading || isPending}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
