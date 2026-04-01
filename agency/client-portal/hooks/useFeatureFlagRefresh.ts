'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

/**
 * useFeatureFlagRefresh
 *
 * Polls the session endpoint every 5 minutes to force NextAuth to re-call
 * the jwt() callback, which re-fetches feature flags from the DB (via the
 * in-memory cache in lib/features.ts).
 *
 * This ensures feature flag changes propagate to active users within ~5
 * minutes, rather than waiting up to 1 hour for the JWT maxAge to expire.
 *
 * Call this once inside the authenticated portal layout or a root client
 * wrapper. No-op if the user is unauthenticated.
 */
export function useFeatureFlagRefresh(intervalMs = 5 * 60 * 1000) {
  const { data: session, update } = useSession()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Only poll when the user is authenticated
    if (!session?.user) return

    // Fire an immediate refresh on mount (after initial render)
    update()

    // Then refresh every intervalMs
    intervalRef.current = setInterval(() => {
      update()
    }, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [session?.user, update, intervalMs])
}
