"use server"

import { revalidatePath } from "next/cache"
import { setFeatureFlag } from "@/lib/features"

export async function updateFeatureFlagAction(
  tenantId: string,
  flagKey: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await setFeatureFlag(tenantId, flagKey, enabled)
    revalidatePath(`/admin/clients/${tenantId}`)
    return { success: true }
  } catch (err) {
    console.error("[updateFeatureFlag]", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update feature flag",
    }
  }
}
