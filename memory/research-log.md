# Research Log

## 2026-04-01 — Error Boundaries in Next.js 15 App Router for Multi-Tenant SaaS

**Domain:** [ux], [arch]

**Context:** The client portal has `error.tsx` files at the root and `(portal)` route group level — but individual portal routes (`/settings`, `/content`, `/studio`) were missing their own error boundaries. This means an error on the settings page would fall back to the generic portal error state, losing the user's in-progress form data and providing a poor recovery experience.

**How Next.js 15 error.tsx works (from official docs):**

Next.js App Router `error.tsx` files are React error boundaries scoped to a route segment. They catch uncaught exceptions from:
- Server Components in that segment
- Client Components in that segment (via React's error propagation)
- Child segment page.tsx files

The key architectural distinction from React class error boundaries:
1. `error.tsx` is a **file-based convention**, not a reusable component — you can't pass it as `<ErrorBoundary />` to wrap specific sub-sections
2. Errors in a parent `error.tsx`'s layout (not page) are **not** caught by the child's `error.tsx` — they're caught by the nearest parent error boundary
3. `global-error.tsx` (in `app/`) is special — it replaces the root `layout.tsx` entirely when active, so it must render a full HTML document

**Pattern for the client portal:**

Each feature-route needs its own `error.tsx` because:
- The portal's layout-level `error.tsx` doesn't preserve the user's scroll position or form state
- Route-level errors can show a more contextual recovery action (e.g., "Try again" for settings vs. "Go to dashboard" for content)
- The studio page (`/studio`) has unique failure modes (Sanity misconfiguration) that need a custom error state

**What was added today:**
- `app/(portal)/settings/error.tsx` + `loading.tsx` — profile + security card skeleton
- `app/(portal)/content/error.tsx` + `loading.tsx` — content hub grid skeleton
- `app/studio/error.tsx` + `loading.tsx` — standalone studio chrome skeleton (outside portal route group)

**Key lesson:** In Next.js App Router, every significant feature route should have its own `error.tsx` and `loading.tsx`. The parent `error.tsx` serves as a safety net, but route-specific boundaries give better UX because:
1. They preserve sibling route context (sidebar nav stays visible, only the page body shows the error)
2. Recovery actions are context-appropriate
3. Loading skeletons match the actual page content, reducing layout shift

**Limitations discovered:** There is no way to create a reusable `ErrorBoundary` component that can be placed inside a page to catch errors in a specific sub-section (e.g., only the sidebar rather than the whole page). This is a fundamental limitation of the React error boundary model combined with Next.js file conventions. Workaround: use React `ErrorBoundary` class components inside client components for fine-grained error isolation.

---

## 2026-04-01 — Ticket Queue UX: Undo for Stage Moves

**Domain:** [ux]

**Finding:** CRM tickets queue has excellent keyboard navigation (j/k), drag-and-drop, bulk actions, and optimistic updates — but **no undo for stage moves**. Agents performing fast triage (drag 5 tickets to "Done") have no recovery path if they move the wrong batch. The research is unambiguous: "Undo is the single most empowering feature for high-volume agent workflows" (UX Research, Session 32).

**Why optimistic updates without undo create anxiety:** The current `handleDragEnd` already does optimistic updates — the UI moves the ticket instantly while the API call fires. This is great for perceived speed, but creates a window where the agent believes the move is done when the server hasn't confirmed it yet. If the API call fails silently (network timeout with no error shown), the ticket is in an inconsistent state between server and client. Undo resolves this by giving the agent a recovery path AND by providing clear feedback about what happened.

**Implementation approach:**
- Track `previousStageId` for each ticket before an optimistic move
- On drag end, show a toast with "Ticket moved to [Stage] — [Undo]" (5-second window)
- If user clicks Undo within 5s, call `ticketsApi.moveStage(ticketId, previousStageId)` and revert UI
- Clear the undo timer if the ticket is moved again before the window expires
- For bulk moves, skip per-ticket undo (too complex for v1) — require confirmation instead

**Reference patterns:** Slack "Undo send", Gmail "Undo", Linear "Undo history"

---

## 2026-04-01 — Next.js App Router `global-error.tsx` Gap

**Domain:** [arch] [dx]

**Finding:** The portal has per-segment `error.tsx` files (portal error, admin error, billing error, support error, etc.) but is **missing `app/global-error.tsx`**.

**Why this matters:** In Next.js App Router, `error.tsx` is a React error boundary scoped to a route segment (layout or page). Errors that escape all segment boundaries — or occur in the **root layout** itself — need `global-error.tsx`.

The `app/layout.tsx` is a Server Component. If an error is thrown during its rendering (e.g., a failing `auth()` call, a DB error in `getEnabledFeatures()`, or a thrown redirect), and there is no `global-error.tsx`, Next.js will render a **blank page** with no error UI.

**The specific risk in the portal:** The portal layout (`app/(portal)/layout.tsx`) calls `auth()` and `getEnabledFeatures()` directly. If these throw (network failure, DB timeout), the error propagates up to `app/layout.tsx`, and without `global-error.tsx` the user gets a white screen.

**Next.js docs pattern for `global-error.tsx`:**
```tsx
'use client' // Must be a client component
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

Note: `global-error.tsx` replaces the root HTML document (`<html>`, `<body>`) — so it must include those tags.

**Decision:** Will add `app/global-error.tsx` + `app/(portal)/global-error.tsx` as a Phase 6 polish item. Also need `app/api/global-error.tsx` for API route errors.

---

## 2026-04-01 — Partial Prerendering (PPR) in Next.js 15

**Domain:** [perf]

**Finding:** PPR is still **experimental** in Next.js 15 and explicitly marked "not recommended for production." It requires `experimental.ppr: 'incremental'` in next.config.ts and opt-in per route via `export const experimental_ppr = true`.

**How it works:** Next.js prerenders a static "shell" at build time and leaves Suspense-wrapped "holes" for dynamic content (auth, cookies, searchParams, uncached fetch). At request time, the static shell streams down immediately while dynamic holes are resolved in parallel — all in one HTTP request.

**Relevance to portal:** Our portal is heavily auth-dependent and per-tenant. Most routes are already dynamic (require auth check via `auth()`). PPR would mainly help the public-facing `/` or `/s/[subdomain]` pages — but those don't exist yet and may not need PPR for a while.

**Decision:** Not worth investing in PPR right now (experimental, adds complexity, minimal benefit for authenticated per-tenant portal). Revisit when it stabilizes in a future Next.js release.

---

## Previous Entries

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

## 2026-04-01 — Feature Flag Propagation Delay in NextAuth v5 JWT Strategy

**Domain:** [arch], [dx]

**Context:** Built Phase 0 feature flag admin UI today for the client portal. Feature flags are embedded in the JWT payload via the `jwt()` callback, so middleware (Edge Runtime) can check them without a Prisma round-trip. This raises a propagation question: when an admin toggles a flag in `/admin/clients/[tenantId]`, how long until existing logged-in users see the change?

**The latency problem:** NextAuth v5 JWT strategy does NOT re-call the `jwt()` callback on every request — it only re-calls it when the JWT is expired or when `useSession().update()` is explicitly called client-side. With `maxAge: 3600` (1 hour), a user's JWT could be up to 59 minutes stale after an admin toggles a flag.

**Options to fix:**

1. **Call `update()` client-side after toggling** — After the `toggleFeatureFlagAction` succeeds, call `useSession().update()` to refresh the JWT. This forces NextAuth to re-call the `jwt()` callback and embed the new `enabledFeatures`. The client-side approach is viable because the admin is already in a client component. For non-admin users, they'd naturally get the new flags on their next session start (login refresh, tab close/open).

2. **Separate cookie for flag state** — Store `enabledFeatures` in a separate HTTP-only cookie read by middleware, and update that cookie via a server action. More complex but enables real-time propagation without JWT expiry dependency.

3. **Prisma read on every middleware request (swap to database session)** — Switch from JWT to database session strategy. Middleware can call Prisma directly (though Prisma on Edge is problematic). This is the heaviest option.

4. **Accept the 1-hour lag** — For a portal where feature flags don't change constantly, "changes propagate within 1 hour" may be acceptable. Document it as a known limitation.

**What I'll implement next:** Call `update()` from the `FeatureFlagToggle` component after the action succeeds, so admin users see instant feedback. This is the simplest correct fix.

**Reference:** NextAuth v5 `useSession().update()` — https://next-auth.js.org/getting-started/client#updatesession

