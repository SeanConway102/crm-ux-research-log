# Research Log

## 2026-04-01 — Feature Flag Stale JWT Problem

**Domain:** [auth] [arch]

**Problem identified:** Feature flag enforcement in middleware relies on `session.user.enabledFeatures` embedded in the JWT at sign-in time. NextAuth v5 with JWT strategy doesn't call the `jwt()` callback on every request — only when creating a new session or when the JWT `maxAge` expires.

**Default `maxAge` in NextAuth v5:** 30 days (from `next-auth` v5 default)

**Impact:** When an admin toggles a feature flag via `/admin/clients/[tenantId]`, all logged-in users for that tenant will NOT see the change until they re-authenticate — which could be up to 30 days.

**What the code does today:**
```typescript
// middleware.ts — reads STALE flags from JWT
const enabledFeatures = session.user?.enabledFeatures
if (!isFlagEnabled(enabledFeatures, requiredFlag)) {
  return NextResponse.redirect(dashboardUrl)
}

// lib/features.ts — has in-memory cache but middleware never calls it
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000 // 60 seconds
```

**Why the in-memory cache doesn't help:** The cache is in `lib/features.ts` (server-side), but middleware has its own execution context. Even if we called `getEnabledFeatures()` from middleware, each serverless invocation gets a fresh process — the in-memory Map would be empty on cold start.

**Fix options evaluated:**

| Option | Pros | Cons |
|--------|------|------|
| 1. Reduce JWT `maxAge` to 1h | Simple, no code change to middleware | Flag propagation still delayed up to 1h |
| 2. Client-side session refresh | Fresh flags on demand | Requires client JS, complex |
| 3. Middleware → DB call | Always fresh | Prisma in Edge is problematic (no SQLite driver) |
| 4. Middleware → internal API route | Fresh flags without Edge DB | Extra latency per request |

**Decision:** Implement Option 1 (reduce `maxAge`) + add client-side session refresh hook.

- Set `session: { strategy: "jwt", maxAge: 3600 }` in NextAuth config (1 hour)
- Add a `useFeatureFlagRefresh` hook that calls `useSession().update()` every 5 minutes on the client side
- This ensures flags propagate within 5 minutes for active users, and within 1 hour via JWT refresh for inactive users

**Key lesson:** When embedding dynamic data in JWTs, always consider the TTL of that data and provide a refresh mechanism. The `jwt()` callback fires on every token refresh — leverage that for data that changes at runtime.

---

## Previous Entries

_(add new entries above, keep most recent first)_
