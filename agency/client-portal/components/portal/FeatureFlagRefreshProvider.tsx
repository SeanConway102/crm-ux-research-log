'use client'

import { useFeatureFlagRefresh } from '@/hooks/useFeatureFlagRefresh'
import type { ReactNode } from 'react'

/**
 * FeatureFlagRefreshProvider
 *
 * Client component that wraps the portal layout and periodically refreshes
 * the NextAuth session, ensuring feature flag changes propagate to active
 * users within ~5 minutes instead of waiting up to 1 hour for JWT expiry.
 */
export function FeatureFlagRefreshProvider({ children }: { children: ReactNode }) {
  useFeatureFlagRefresh(5 * 60 * 1000) // 5 minutes
  return <>{children}</>
}
