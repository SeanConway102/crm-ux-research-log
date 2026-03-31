# Research Log

Tags: [ux], [react], [dx]

---

## 2026-03-31 — React 19 `useOptimistic` for Comment Threads

### What I Learned

`useOptimistic` (React 19) enables **optimistic UI updates** — the UI updates instantly on user action, assuming the server call will succeed, then rolls back if it fails. This is the pattern behind "instant feedback" in social apps (likes, comments, etc.).

**The core pattern:**
```tsx
const [optimisticComments, addOptimisticComment] = useOptimistic(
  comments,                          // current state
  (state, newComment) => [...state, newComment]  // reducer
)

async function handleSubmit(formData: FormData) {
  const optimistic = { id: Date.now(), body: "...", pending: true }
  addOptimisticComment(optimistic)   // instant UI update
  await fetch("/api/comments", { body: formData }) // server call
  // on success: real comment replaces optimistic one
  // on failure: optimistic comment removed, error shown
}
```

**Why this matters for the portal's ticket comments:**
- Comment threads feel instant, not like a form submission
- Users get visual feedback immediately (comment appears with "pending" state)
- Works naturally with React Server Actions in Next.js 15
- Fallback: if server fails, comment is removed cleanly

**Key insight from research:** The distinction between `useOptimistic` + Server Action vs. `useFormState`:
- `useOptimistic` — for arbitrary optimistic state (comments, likes, toggles)
- `useFormState` (now `useActionState`) — for form field updates based on server response

For a comment form, `useOptimistic` + Server Action is the ideal combo:
1. `useOptimistic` → immediate comment appears
2. Server Action → POSTs to API, returns the real comment
3. If the server returns the real comment, optimistic comment is "confirmed"

**Potential pitfalls:**
- Race conditions: rapid submissions need a queue
- Rollback UX: user sees comment disappear on failure — needs a toast explaining why
- Id generation: optimistic IDs must be temporary and replaced by server IDs

### How It Applies to This Project

The ticket detail page (being built today) uses `useOptimistic` for the comment form. This makes the comment thread feel native and responsive — critical for a support portal where users are often anxious about whether their message was received.

The comment form:
1. User types and submits
2. Comment appears immediately with a subtle "sending..." indicator
3. On success: indicator disappears, comment is confirmed
4. On failure: comment fades out, error toast appears with retry option

This is dramatically better UX than a loading spinner + page refresh.

---

## 2026-03-31 PM — Multi-Tenant SaaS DB Patterns [arch]

### What I Learned

Three main patterns for multi-tenant database isolation:

1. **Shared database + `tenant_id` column (row-level)** — current portal approach. All tenants share tables, differentiated by a `tenant_id` FK. Application enforces isolation. Prisma's `where: { tenantId }` on every query. Fast (single DB), cheap (shared resources), risky (one bug = data leak).

2. **Separate PostgreSQL schemas per tenant** — `tenant_acme`, `tenant_smithco` schemas in one DB. Migration complexity is the killer: you must run every schema migration N times (once per tenant). Good for high-isolation, low-tenant-count use cases. Not practical for 50+ tenants.

3. **Separate databases per tenant** — completely isolated DBs. Maximum security/compliance, maximum operational overhead. Each new tenant = new database provisioning. Used by healthcare/finance SaaS where compliance demands it.

**Row-Level Security (RLS)** is the pragmatic upgrade to pattern 1: PostgreSQL-level enforcement of `tenant_id` filtering. Even if application code has a bug, RLS prevents cross-tenant reads. Postgres RLS uses `SET app.current_tenant = 'acme-corp'` in a transaction, then `Row Level Security` policies check it. This is what separates "professional multi-tenancy" from "startup multi-tenancy."

**Key insight from Stripe docs:** The Customer Portal integration flow: create a billing portal session server-side (not client-side fetch → redirect), then redirect from the server. The correct pattern is `POST /api/billing/portal-session` which creates `stripe.billingPortal.sessions.create()` and does `redirect(session.url)`. The current portal code uses a hardcoded Stripe URL which won't work.

### How It Applies to This Project

The portal's Prisma schema (Tenant, PortalUser) uses pattern 1 — shared DB with `tenantId` column. The CRM tickets also use `tenant_id`. This is correct for the scale. Future hardening: add PostgreSQL RLS policies at the database level as a second line of defense.

The Stripe Customer Portal bug fix (building today) will use the correct server-side redirect pattern.

## 2026-03-31 PM — Sanity Studio structureTool + visionTool [ux]

### What I Learned

**structureTool** uses the Structure Builder API (`@sanity/structure`) to customize the desk layout. It takes a `structure` option — a function `(S) => StructureNode` where `S` is the desk structure builder. Common patterns:
- `S.list()` → contains `S.listItem()` for each document type
- `S.divider()` → separators between sections
- `S.documentTypeList('page')` → auto-generates a list for a document type (all documents of that type, sortable)
- Custom child nodes with `S.document()` or `S.component()` for richer UIs

**visionTool** is a plugin (`@sanity/vision`) that embeds Sanity Vision (GROQ playground) inside the Studio. Great for debugging GROQ queries without leaving the Studio. Registered as `visionTool()` in the plugins array.

**The portal's `sanity-config-factory.ts` currently has `plugins: []` and `schema: { types: [] }`** — Phase 2b needs to populate both. The config factory uses dynamic import of `sanity` to avoid TypeScript module resolution issues. The `defineConfig` from `sanity` returns a plain config object that accepts plugins like `structureTool({ structure })` and `visionTool()`.

### How It Applies to This Project

Phase 2b (building today): add `structureTool` and `visionTool` to the Studio config. The desk structure will be a simple default structure (list of all schema types, sorted). This makes the Studio actually usable — editors can browse their content types, not just an empty desk.

---

## 2026-03-31 PM — Embedded Sanity Studio in Next.js App Router

### What I Learned

**How embedded Sanity Studio actually works under the hood:**

The `NextStudio` component from `next-sanity/studio` is a Client Component (carries `"use client"` internally). It renders inside a `<noscript>` fallback for SSR and uses a bridge script loaded from Sanity's CDN (`core.sanity-cdn.com/bridge.js`). The config passed to `NextStudio` is a plain serializable JS object (no class instances, no React state) — which is why it can be built dynamically in a Server Component and passed as a prop.

**The static vs. dynamic config challenge:**

The official Sanity docs use `force-static` on the Studio page because the config is static (same for all tenants). The `config` object must be a pure JS object with `basePath`, `projectId`, `dataset`, `schema`, and `plugins`.

For **multi-tenant** embedded Studio (each tenant has their own Sanity project):
- The Studio page must use `force-dynamic` (not `force-static`) because the config is per-request
- The `sanity.config.ts` file at the project root is NOT used — instead, the config is built programmatically in a Server Component
- The Studio page is a Server Component that fetches tenant credentials, builds the config, and passes it to `NextStudio`
- `NextStudio` is the only component that needs `"use client"` — the page itself can stay a Server Component

**The `sanity` module resolution problem in pnpm monorepos:**

The `sanity` package (v5.18.0) is installed as a peer dependency of `next-sanity` in the pnpm workspace. Because pnpm uses nested `node_modules`, the actual path is `node_modules/.pnpm/sanity@5.18.0_.../node_modules/sanity`. TypeScript's `moduleResolution: "bundler"` cannot resolve this nested path statically, causing `TS2307: Cannot find module 'sanity'` even though Node.js resolves it correctly at runtime.

**Solution used:** Dynamic import with `// @ts-ignore` suppression, typed as `any`, with a local `StudioConfig` type alias for the return value. At runtime, Node.js correctly resolves the module via pnpm's symlink structure.

**`defineConfig` from `sanity` returns a plain config object**, not a class or complex type — this is what makes it work as a serializable prop.

### How It Applies to This Project

The client portal's Phase 2 (Sanity Studio) is now scaffolded:
- `app/studio/[[...tool]]/page.tsx` — route at `/studio`, outside `(portal)` route group (full-screen)
- `lib/sanity-config-factory.ts` — fetches `sanity_project_id` from CRM via `getCrmSite(tenant.crmSiteId)`, falls back to env vars
- All guarded by existing middleware role checks

### [billing] — Stripe SetupIntent for `past_due` Subscription Recovery

**Key insight:** For recovering `past_due` subscriptions (card declined), use a **SetupIntent with `usage: "off_session"`**. The flow:

1. Portal creates `stripe.setupIntents.create({ customer: "cus_...", usage: "off_session" })`
2. Client enters card via Stripe `CardElement`
3. Client submits → `stripe.confirmCardSetup(clientSecret, { payment_method: { card: cardElement } })`
4. Stripe attaches the card to the customer AND automatically retries the failed subscription invoice
5. On success → `invoice.paid` webhook fires → CRM updates subscription to `active`

**Why SetupIntent (not PaymentIntent):** A PaymentIntent collects payment immediately. A SetupIntent just saves the card for future use — perfect for subscription recovery where we want Stripe to handle the retry logic automatically.

**Why `usage: "off_session"`:** Required for Stripe to use the newly-attached payment method for automatic subscription retries without requiring the customer to be present.

**Portal pattern:** The billing page stays as a Server Component (fetches subscription/invoices). A `"use client"` `BillingPaymentForm` component fetches the SetupIntent client_secret and wraps `PaymentForm` inside Stripe's `Elements` provider. No `next/dynamic` needed.

---

### [billing] — Stripe Webhook Design

**Key design decision:** The portal's Stripe webhook should **never return a non-2xx to Stripe** even when CRM forwarding fails. Returning an error to Stripe causes a retry storm. Instead: always return 200, log CRM failures.

The `invoice.payment_failed` → `past_due` flow:
1. Stripe sends `invoice.payment_failed` event
2. Portal webhook receives it → forwards to CRM
3. CRM processes event → updates subscription to `past_due`
4. Next portal page load → subscription status re-fetched → payment alert shown
5. User pays via embedded Stripe Elements → webhook fires `invoice.payment_succeeded` → CRM sets `active`

The embedded Stripe Elements form needs a SetupIntent, which requires a `/api/billing/setup-intent` route. Phase 4b will complete the full embedded form.

---

## 2026-03-31 PM — React 19 `useOptimistic` + `startTransition` — The Critical Pair [react], [ux]

### What I Learned

`useOptimistic` is **designed to work inside `startTransition`** — and without it, the rollback-on-error behavior doesn't work.

**The mechanism:** When `useOptimistic` is used with a reducer, React tracks the "optimistic" state while a Transition is in-flight. If the Transition's async action **throws an unhandled error**, React automatically re-renders using the real state (`value` from `useOptimistic`) instead of the optimistic state — this is the "rollback." If the action completes successfully, React commits the optimistic state as the real state.

**The key insight from React docs:**
> "There's no extra render to 'clear' the optimistic state. The optimistic and real state converge in the same render when the Transition completes."
> 
> "If `saveChanges` threw an error, the Transition ends, and React renders with whatever value `value` currently is."

**Why this matters for error handling:**
- When wrapped in `startTransition`, errors cause an **automatic rollback** — no manual state restoration needed.
- Without `startTransition`, the optimistic update is just a regular `useReducer` dispatch — it stays in the state permanently until manually removed.

**The portal's comment thread had this bug:** It used `useOptimistic` with a reducer but called `dispatch` directly in an async function (not inside `startTransition`). When the server returned an error, the optimistic comment remained stuck with no way to remove it.

**Correct pattern:**
```tsx
const [isPending, startTransition] = useTransition()
const [optimisticComments, dispatch] = useOptimistic(initialComments, commentsReducer)

function handleSubmit(e) {
  e.preventDefault()
  dispatch({ type: "add", comment: optimisticComment }) // immediate UI update
  
  startTransition(async () => {
    try {
      const result = await saveComment(body)
      // Replace optimistic with real
      dispatch({ type: "replace", tempId, real: result })
    } catch (err) {
      // React automatically rolls back to real state — BUT only if
      // the error is thrown OUTSIDE the startTransition callback.
      // If caught inside, no rollback happens.
      // Solution: either re-throw, or handle the failed state manually
      // (mark comment as failed, show retry button)
      dispatch({ type: "replace", tempId, real: { ...failedComment, _failed: true } })
    }
  })
}
```

**Important nuance:** Throwing inside `startTransition`'s async callback does NOT trigger the automatic rollback — the error is caught by the async machinery, not by React's transition tracking. To get automatic rollback, you need to throw **after** the `startTransition` call returns (synchronously), or handle failure state manually.

**The portal's solution:** On failure, mark the comment as `_failed: true` with a retry/dismiss UI. This is better UX than silent rollback anyway — users see what failed and can retry.

### [ux] — B2B SaaS Navigation: Why `/content` Needs to Exist

The sidebar links to `/content`. If that route 404s, it breaks the core navigation contract. B2B SaaS users arrive via email link → do one thing → leave. They don't explore. Every broken nav link destroys trust.

Rule: **every sidebar link must resolve to a real page, even if it's a "coming soon" placeholder.**

---

*Tags: [react], [ux], [arch]*

---

## 2026-03-31 — Feature Flag Architecture for Multi-Tenant SaaS [arch], [dx]

### What I Learned

**Feature flags in multi-tenant SaaS face a key architectural challenge: where to evaluate flags, and how to avoid a DB call on every request?**

Three patterns for flag storage:
1. **Database + in-memory cache** — what I implemented. Flags stored in Prisma SQLite. A module-level `Map<tenantId, {flags, ts}>` caches results with a 60s TTL. This is the pragmatic approach for small-to-medium SaaS. No external dependencies, works in Next.js serverless, and refreshes within 60s of a flag change.

2. **Redis (or any KV store)** — production pattern for larger scale. Each tenant's flags are a single `GET tenant:features:{id}` call. Typical TTL: 30-60s. Writes invalidate the key. Pros: fast, shared across instances. Cons: another dependency to manage.

3. **External SDK (LaunchDarkly, Unleash)** — the "correct" production pattern. SDK bootstraps from a streaming data export (SSE or webhook), stores flags in memory, and evaluates locally. Evaluation: 1-5ms (local) vs 100-500ms (remote call). This is what separates serious flag systems from amateur ones.

**The critical Edge Runtime constraint in Next.js:**
Next.js middleware runs on the Edge Runtime, which has no Node.js APIs. Prisma, `fs`, `crypto` (Node.js), and database connections don't work at the Edge. Three solutions:
- **Keep middleware lightweight** (auth check only), evaluate flags in Server Components where Prisma is available
- **Use the Node.js runtime for middleware** (`export const runtime = 'nodejs'`) — trades Edge performance for DB access
- **Pass flags via HTTP header** from a server-side layer (API route or Server Component sets `x-feature-flags` header, middleware reads it)

**Flag types matter for lifecycle management:**
- **Permission flags** (permanent, per-tenant entitlements like "studio", "billing") — our use case
- **Release flags** (temporary, progressive rollout) — removed after 100% rollout
- **Ops flags** (kill switches, circuit breakers) — permanent but should rarely be used

**Key insight from LaunchDarkly docs:** The percentage rollout pattern uses consistent hashing on user ID (`hash(userId + flagKey) % 100`) to ensure the same user always gets the same experience. This prevents the "feature flicker" problem where a user might see a feature on one request and not on the next.

**SQLite and Prisma at the Edge:**
SQLite doesn't work at the Edge (no filesystem). But Prisma can work in Next.js Server Components and API routes (Node.js runtime). The pattern: middleware runs at Edge, reads auth from JWT (stateless), passes tenant context via headers. Server Components (Node.js runtime) read the DB for actual feature flag values.

### How It Applies to This Project

The portal's `lib/features.ts` uses pattern 1 — in-memory cache with Prisma. The cache is module-level (`Map`), persists across invocations in the same serverless instance, and expires after 60s. This is the right choice for our scale. When we hit real multi-instance production scale, the upgrade path is to Redis.

The sidebar hides nav items for disabled features. The portal layout server component fetches enabled features and passes them to the client sidebar. The middleware handles auth; flag enforcement lives in page components (Node.js runtime).

The `TenantFeatureFlag` model uses a composite PK `@@id([tenantId, featureFlagId])` because SQLite doesn't support auto-incrementing IDs well in composite scenarios, and this is more efficient for our access pattern (always look up by tenant + flag).

---

*Tags: [arch], [dx]*
