'use server';

import { setFeatureFlag } from '@/lib/features';
import { revalidatePath } from 'next/cache';

export type FeatureFlagToggleState = {
  tenantId: string;
  flagKey: string;
  error?: string;
  success?: boolean;
};

export async function toggleFeatureFlagAction(
  prevState: FeatureFlagToggleState,
  formData: FormData
): Promise<FeatureFlagToggleState> {
  const tenantId = formData.get('tenantId') as string;
  const flagKey = formData.get('flagKey') as string;
  const enabled = formData.get('enabled') === 'true';

  if (!tenantId || !flagKey) {
    return { tenantId, flagKey, error: 'Missing tenantId or flagKey', success: false };
  }

  try {
    await setFeatureFlag(tenantId, flagKey, enabled);
    revalidatePath(`/admin/clients/${tenantId}`);
    return { tenantId, flagKey, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update feature flag';
    return { tenantId, flagKey, error: message, success: false };
  }
}
