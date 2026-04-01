# Research Log

Tags: [ux], [react], [dx], [arch]

---

## 2026-04-01 AM — Phase 0 Feature Flag Audit [arch], [dx]

### What I Learned (Audit Result)

Phase 0 (Feature Flags) is **essentially complete**. Here's what exists:

1. ✅ **Prisma schema** — `FeatureFlag` + `TenantFeatureFlag` models with composite PK
2. ✅ **lib/features.ts** — `isFeatureEnabled`, `getEnabledFeatures`, `setFeatureFlag`, `getTenantFeatureFlags`, `invalidateCache`
3. ✅ **Admin UI** — `/admin/clients/[tenantId]` with `FeatureFlagToggle` using `useActionState`, optimistic pending state
4. ✅ **Sidebar nav hiding** — `PortalSidebar` + `MobileDrawerContent` filter NAV_ITEMS by `enabledFeatures`
5. ✅ **Page-level enforcement** — studio, support, billing, content_hub pages all check `isFeatureEnabled()` and redirect if disabled
6. ✅ **Seed script** — `prisma/seed.ts` with all flag definitions, wired to `package.json` via `"prisma": { "seed": "tsx prisma/seed.ts" }`

**Middleware enforcement is intentionally skipped** — Prisma (SQLite) can't run on Edge Runtime where Next.js middleware executes. The agreed workaround: page-level redirects are sufficient (sidebar hides nav items; direct URL access redirects to dashboard).

**Architecture note:** The sidebar NAV_ITEMS must include ALL feature-gated routes so they can be hidden when disabled. Added `tv_feed: { href: "/content/tv-feed", label: "TV Feed", icon: Radio, featureKey: "tv_feed" }` to NAV_ITEMS.

### Open questions
- Should we add a "Coming Soon" section to the sidebar (below the nav items) showing disabled features? Already done — `hiddenItems` are shown under "Coming Soon" with 👁️ icon.
- Does the mobile bottom nav need tv_feed? No — it's under Content in the hamburger drawer (mobile nav has its own `MOBILE_NAV_ITEMS` hardcoded to 5 items, matching SPEC §10.2).

---

---

## 2026-04-01 AM — Tenant White-Label Theming with CSS Variables in Tailwind v4 [ux], [arch]

### What I Learned

**How `bg-[var(--accent)]` works in Tailwind v4:**
Tailwind v4 arbitrary value syntax `bg-[var(--name)]` generates a CSS class that sets the property to the literal CSS variable:
```css
.bg-\[var\(--accent\)\] { background-color: var(--accent); }
```
This is the standard Tailwind v3/v4 mechanism for using CSS custom properties as color values. The class is generated at build time; the variable value is resolved at runtime by the browser. ✅ Works.

**The right way to apply per-tenant accent colors:**
The portal layout is a Server Component that fetches the tenant's `accentColor` from Prisma. It can pass the hex value to Client Components as a prop, which then applies it as a CSS variable inline:
```tsx
// Server Component: fetch and pass
const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
return <PortalSidebar accentColor={tenant.accentColor} />

// Client Component: apply CSS variable
<aside style={{ "--accent": accentColor } as React.CSSProperties}>
  {/* active state */}
  <div className={cn("bg-[var(--accent)]", active && "...")} />
</aside>
```

**Why not use `data-theme` + CSS selectors:**
Tailwind v4's `@custom-variant dark` and CSS `[data-theme]` selectors require pre-defined themes in CSS. For per-tenant dynamic colors (not just dark/light), CSS variables with inline `style` props are the right tool. `data-theme` would require a CSS class per tenant, which doesn't scale.

**The `--primary` vs `--accent` question:**
The portal uses `--primary` as its brand color throughout (buttons, sidebar active state). Setting `--primary` via CSS variable overrides ALL `text-primary`, `bg-primary`, etc. usages throughout the portal. This is a blunt instrument — it would also override the CT Website Co. primary in the header logo area.
**Better approach:** Use a separate `--accent` variable only for the tenant-specific active state and accent elements, keeping `--primary` for core CT Website Co. branding.

### How It Applies to This Project

Phase 6 tenant theme system:
1. Fetch `tenant.accentColor` in `app/(portal)/layout.tsx`
2. Pass `accentColor` to `PortalSidebar` and `PortalHeader`
3. Sidebar applies `style={{ "--accent": accentColor }}` on the active nav item
4. Header avatar uses `bg-[var(--accent)]` for the user's avatar background
5. CSS variable `--accent` defined in `globals.css` defaults to `#6366F1` (CT Website Co. indigo)

---

## 2026-04-01 AM — Tailwind v4 `tw-animate-css` Animation System [ux], [dx]

### What I Learned

`tw-animate-css` is a Tailwind CSS v4 plugin that provides a complete set of animation utilities via CSS custom properties. Unlike Tailwind v3 where animations are defined in `tailwind.config.js`, v4 uses `@utility` directives in CSS that register classes at compile time.

**Key discovery:** `tw-animate-css` provides ALL the slide/direction/animation utilities I need for the mobile Sheet drawer:
- `slide-in-from-left` / `slide-out-to-left` ✅
- `slide-in-from-right` / `slide-out-to-right` ✅
- `slide-in-from-bottom` / `slide-out-to-bottom` ✅
- `fade-in` / `fade-out` ✅
- `zoom-in` / `zoom-out` ✅

**How `data-[state=open]:` works with tw-animate-css:**
```css
/* The tw-animate-css plugin registers these as utilities:
data-[state=open]:animate-in → animation: enter 150ms ease
data-[state=closed]:animate-out → animation: exit 150ms ease

/* And the slide utilities set CSS vars:
slide-in-from-left → --tw-enter-translate-x: -100%
slide-out-to-left → --tw-exit-translate-x: -100%

/* The enter/exit keyframes use these vars:
@keyframes enter {
  from { opacity: var(--tw-enter-opacity,1); 
         transform: translate3d(var(--tw-enter-translate-x,0), ...) }
}
```

**Why this matters for the Sheet component:**
- The Sheet's `animate-in`/`animate-out` classes work out of the box with `tw-animate-css`
- No custom `@keyframes` needed in globals.css — the plugin handles everything
- The `data-[state=open]:` prefix from Radix Dialog state attribute wires perfectly to the animation classes

**The 150ms default duration** (`--tw-duration,.15s`) is appropriate for the mobile Sheet — fast enough to feel responsive, slow enough to communicate "new content appeared."

### How It Applies to This Project

The `Sheet` component uses:
```tsx
className="data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
          data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left
          fixed top-0 left-0 z-50 h-full w-3/4 max-w-sm border-r bg-surface"
```

All of these classes are provided by `tw-animate-css`. The Sheet component needs zero custom CSS.

---

## 2026-04-01 AM — Multi-Tenant Mobile Navigation UX Patterns [ux], [arch]

### What I Learned

**Three common patterns for mobile nav in multi-tenant B2B SaaS:**

1. **Bottom tab bar (spec approach)** — 5 primary destinations as tabs. Best for portals where users frequently switch between a fixed set of sections. Clear active state. Takes up valuable screen real estate (60px on iPhone with home indicator).

2. **Hamburger → full-screen drawer** — Traditional approach. Hamburger in top-left. Drawer slides in from left. Good for complex nav with many items. Less discoverable.

3. **Bottom bar + contextual drawer** — Hybrid: bottom bar shows 3-4 key destinations; secondary nav lives in a hamburger drawer. Best for feature-rich portals where 5 tabs aren't enough.

**Spec choice: Bottom tab bar** — Matches SPEC §10.2 which specifies "5 items max: Dashboard, Studio, Content, Support, Billing." Simple, discoverable, consistent with iOS/Android conventions.

**The "hamburger inside layout" pattern:**
The hamburger trigger (Radix `SheetTrigger`) must be rendered inside the flex container (not the sidebar) so it's always visible on mobile. The `SheetContent` (drawer) can be rendered anywhere in the component tree because Radix portals it to `document.body`. Best practice: render the drawer near the header in the layout, so it's logically grouped.

**Bottom nav safe-area insets:**
On iOS with a home indicator, the bottom nav needs `padding-bottom: env(safe-area-inset-bottom)` to avoid being obscured. Tailwind utility: `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}`.

**Mobile content offset:**
When a fixed bottom nav is present, page content needs extra bottom padding (`pb-20`) to avoid being hidden behind the nav. Desktop (`md:`) removes this extra padding.

**The `SheetTrigger` placement challenge:**
`SheetTrigger` must be inside `<Sheet>`. In the portal layout:
```tsx
<Sheet> {/* drawer state owner */}
  <PortalMobileDrawer />  {/* SheetContent lives here */}
  <PortalHeader>
    <SheetTrigger asChild>  {/* hamburger button in header */}
      <button>...</button>
    </SheetTrigger>
  </PortalHeader>
</Sheet>
```
But `PortalHeader` is a separate component from `PortalMobileDrawer`. Solution: render `<Sheet>` wrapping the header and drawer together, OR use a shared state (React context or lifted state) to coordinate.

**Simpler approach used:** `<Sheet>` wraps the entire flex column, with `SheetTrigger` as a sibling inside `<PortalHeader>`. This works because Radix Dialog/Sheet uses a Portal to render the overlay/content to `document.body` — the DOM position of `SheetTrigger` doesn't need to be a direct parent of `SheetContent`.

---

## 2026-04-01 — React 19 `useOptimistic` for Comment Threads

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

## 2026-04-01 PM — Multi-Tenant SaaS DB Patterns [arch]

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

## 2026-04-01 PM — Sanity Studio structureTool + visionTool [ux]

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

## 2026-04-01 PM — Embedded Sanity Studio in Next.js App Router

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

**Portal pattern:** The billing page stays as a Server Component (fetches subscription/invoices). A `"use client"` `BillingPaymentForm` component fetches the SetupIntent client secret and wraps `PaymentForm` inside Stripe's `Elements` provider. No `next/dynamic` needed.

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

## 2026-04-01 PM — React 19 `useOptimistic` + `startTransition` — The Critical Pair [react], [ux]

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

## 2026-03-31 — Vercel Flags SDK + Edge Config for Feature Flags at Edge

### The Problem
Our client portal has feature flags stored in Prisma. The SPEC says to enforce flags in middleware, but **Prisma can't run on Next.js Edge Runtime** (middleware runs on Edge, Prisma is Node.js-only). This is a genuine architectural gap.

### What Vercel Offers
**`@vercel/flags`** — a lightweight feature flag SDK designed specifically for the Vercel/Next.js ecosystem:
- Flags stored in **Vercel Edge Config** (global, low-latency KV store at the edge)
- Evaluated **without a database call** in middleware and edge functions
- Integrates with **Vercel Toolbar** — lets developers override flags locally via encrypted cookie (great for testing)
- Flag definitions in code (`lib/flags.ts`), values in Edge Config
- The Flags SDK handles the override precedence: toolbar override > Edge Config > default

### Architecture Pattern (from benseymour.com)
```
Edge Config store (Vercel) → stores flag values
Flags SDK → evaluates flags at edge (no DB call)
Middleware → reads flags, enforces route access
Vercel Toolbar → local developer overrides
```

In middleware:
```typescript
import { createClient } from '@vercel/edge-config'
const flagsConfig = createClient(process.env.EDGE_CONFIG_FLAGS)
const flags = await flagsConfig.get('homepage_variant')
```

### Trade-off vs Our Current Approach
| Aspect | Our Prisma approach | Vercel Edge Config + Flags SDK |
|---|---|---|
| Middleware enforcement | ❌ Can't do (Prisma on Edge) | ✅ Native |
| Page-level enforcement | ✅ Works | ✅ Works |
| Admin UI | ✅ Done | ✅ Done (Edge Config dashboard) |
| Flag changes propagation | ~60s (cache TTL) | Instant (edge read) |
| New infrastructure | None | Vercel Edge Config (paid add-on) |
| Toolbar for local dev | ❌ No | ✅ Yes |
| Vercel dependency | None | Required (not portable) |

### Decision for Now
Stick with our Prisma approach. Middleware enforcement is a "nice to have" — the page-level enforcement we have (sidebar hides features, pages redirect) is sufficient for a Phase 0. Vercel Edge Config would help but adds infrastructure cost/complexity.

If the portal grows and flag-checks become a bottleneck or if we need real-time flag changes without 60s cache TTL, revisit `@vercel/flags`.

### Useful Links
- https://flags-sdk.dev — Flags SDK docs
- https://github.com/vercel/flags — SDK source
- https://benseymour.com/blog/2026-03-21-Feature-flags-with-Vercel-Toolbar-and-Edge-Config — Practical setup guide

---

## 2026-03-31 — TDD in Next.js: Testing Server Components is Hard

### The Challenge
Our project uses Next.js App Router with React Server Components (RSC). RSCs are async server functions that render HTML — they're not "called" like regular functions, they're rendered. This makes unit testing them directly impossible with Vitest/Jest.

### Patterns That Work
1. **Pure function extraction** — extract the logic into a testable function, test that. E.g., `getEnabledFeatures(tenantId)` is pure-ish and testable.
2. **Integration tests with a real test DB** — spin up a SQLite in-memory Prisma instance, run the actual Prisma queries, test the results. Our `__tests__/integration/` directory could house these.
3. **Mock at the HTTP layer** — use Supertest or just `fetch()` to call Next.js API routes and check responses. Good for `/api/` route testing.

### What's NOT Worth Doing
- Trying to import and call RSC page components directly in Vitest — the module graph is too complex, hydration issues abound
- Mocking Prisma at the import level — it requires complex `vi.mock()` gymnastics with TypeScript paths

### Our Current Test Strategy
The existing `__tests__/unit/lib/features.test.ts` takes the right approach: **simulate the logic in-memory without Prisma**, testing the pure evaluation logic. This is unit testing the algorithm, not the ORM.

The gap: no integration test with a real SQLite Prisma instance. For Phase 0 completion, I'll add that for `setFeatureFlag`.

---

## 2026-03-31 — Feature Flag Admin UX patterns

**Tags:** [ux], [arch], [react]

**Context:** Building Phase 0 feature flag admin UI for the client portal.

### What I researched

**Feature flag admin UI patterns** — in B2B SaaS, the feature flag admin page typically shows:
1. Flag name + description
2. Beta badge on experimental features  
3. Toggle switch (enabled/disabled)
4. A "Coming Soon" section for disabled flags the tenant doesn't have access to

Key UX lessons:
- **Optimistic UI with pending state**: When a user toggles a switch, show a spinner inline while the server action runs. Don't navigate away or show a modal.
- **Upsert not delete + create**: When disabling a flag, remove the override entirely (return to default=false). When enabling, create the override. The `setFeatureFlag` function in `lib/features.ts` already handles this correctly.
- **Cache invalidation**: The in-memory cache in `lib/features.ts` uses a 60s TTL. After a flag toggle, we call `cache.delete(tenantId)` to force the next `getEnabledFeatures` call to re-fetch from the DB. This is correct.

**React `useActionState` vs `useTransition`**: 
- `useActionState` (React 19) takes `(action, initialState)` and returns `[state, dispatch, isPending]`. Call `dispatch(formData)` to trigger the action. This is what I used.
- The old approach (`useTransition`) is equivalent for simple cases. Both work in Next.js 15 / React 19.

### Key architectural decision

The `FeatureFlagToggle` component uses a `formRef` to programmatically update the hidden `enabled` input before calling `action(fd)`. This is necessary because the `Switch` component fires `onCheckedChange(newValue)` on click, but we need to submit a form with the *new* value (not the old one in the DOM).

The pattern:
```typescript
const handleToggle = (newEnabled: boolean) => {
  const form = formRef.current
  const enabledInput = form.querySelector<HTMLInputElement>('input[name="enabled"]')
  enabledInput.value = String(newEnabled)  // Update to NEW value
  action(new FormData(form))  // Submit
}
```

This avoids the anti-pattern of reading `flag.enabled` (which is the stale server state) and instead submits the desired new state.

### For next time
- The middleware doesn't yet enforce feature flags per route (it only checks auth + role). Per SPEC §3.2.1, the middleware should redirect if a user tries to access `/studio` when the `studio` flag is disabled for their tenant. This is still todo.
- The seed script (`prisma/seed.ts`) seeds the flag registry but `package.json` doesn't have the `prisma.seed` config wired up — need to add `"prisma": { "seed": "tsx prisma/seed.ts" }` to package.json.

---

## 2026-04-01 — React 19 `use()` Hook: Async Server → Client Data Passing [react], [arch]

### What I Learned

React 19's `use()` hook lets Server Components pass **unresolved Promises** directly to Client Components, which then use `use()` to unwrap them. This enables **parallel streaming** — the server can render the layout shell immediately and stream in data as promises resolve.

**The classic pattern (current portal — awaiting in SC):**
```tsx
// Server Component (layout.tsx)
export default async function PortalLayout({ children })
---

## 2026-04-01 AM — Bcryptjs + NextAuth v5 Password Update Pattern [arch], [dx]

### What I Learned

**How to properly update a user's password with bcryptjs + NextAuth v5:**

The pattern for updating a user's password in a NextAuth v5 + Prisma setup:
1. `bcrypt.compare(currentPassword, storedHash)` — verify old password before allowing change
2. `bcrypt.hash(newPassword, 12)` — hash new password with cost factor 12 (recommended 2025)
3. `prisma.portalUser.update({ where: { id }, data: { password: hashed } })` — persist

**NextAuth v5 session.user.id is not automatic:** By default, NextAuth v5 does NOT include `user.id` in the session. You must explicitly propagate it from the JWT callback to the session callback:

```typescript
// jwt callback — set id from user object (credentials or magic link)
if (user) { token.id = user.id }

// session callback — transfer id to session user
if (token) { session.user.id = token.id as string }
```

Without this, `session.user.id` is `undefined` in all server components, which breaks `auth().user.id` lookups needed for settings pages.

**Type declaration must match:** The `declare module "next-auth"` type extension must include `id: string` on the session user object, and the `id` must be set in the jwt callback first.

**Password update is separate from CRM:** Portal users have their own `PortalUser` record with their own password field, separate from the CRM user record. Updating the portal password does NOT update the CRM. This is intentional per SPEC §3.3.

### How It Applies to This Project

The settings page (`/settings`) now correctly:
1. Reads `session.user.id` (fixed auth.ts to propagate it)
2. Fetches user from Prisma `PortalUser` table (not CRM)
3. Verifies current password with `bcrypt.compare` before allowing change
4. Hashes new password with `bcrypt.hash(password, 12)` before storing
5. Uses Zod v4 for validation (different error structure from Zod v3 — issue paths are arrays, not dot-strings)

---

## 2026-04-01 AM — Zod v4 Error Structure vs v3 [dx]

### What I Learned

Zod v4 changed the error structure significantly from Zod v3:

**Zod v3 error.issues:**
```typescript
{ path: ["email"], message: "Invalid email", code: "invalid_string" }
// path is a string array, e.g. ["email"]
```

**Zod v4 error.issues:**
```typescript
{ path: ["email"], message: "Invalid email", code: "too_small", origin: "string" }
// path is still an array, code is different
// refine() errors have code: "custom" not code: "custom"
```

The key difference for my code: `issue.path.join(".")` still works (gives `"email"`), but `refine()` error paths are at the field level, not root level. The path resolution is: `issue.path[issue.path.length - 1]` gives the last path segment (the field name).

**Important:** In Zod v4, `z.string().max(100)` with `.refine()` can cause path conflicts. Best to use `.superRefine()` for complex cross-field validations, or just use separate field-level `refine` calls.

### For Next Time

If using `z.object().refine()` for cross-field validation (e.g., password confirm), the error path points to the field being refined. Don't try to use `path: []` for root errors — use `.superRefine()` instead.

---

## 2026-04-01 AM — NextAuth v5 Credentials Provider + Magic Link Coexistence [arch]

### What I Learned

The portal uses BOTH email magic link and credentials (password) providers. Key insight about how NextAuth v5 handles these:

1. **Magic link** — triggers `signIn("email", { email })`. NextAuth calls the Email provider which sends the magic link. On click, the session is established via the token flow. The `jwt` callback receives `user` from the database (via PrismaAdapter). The user's `id` IS available.

2. **Credentials (password)** — triggers `signIn("credentials", credentials)`. The `authorize()` function is called, which returns a user object. That object MUST include `id` for `token.id = user.id` to work in the jwt callback.

**The coexistence pattern works correctly** because both paths eventually call the jwt callback with a user object that has `id`. The magic link path uses `PrismaAdapter.createUser()` to create the user in the DB, then NextAuth fetches it back.

**Key architectural note:** The `jwt` callback calls `getCrmUserByEmail(email)` for BOTH provider types (when `user` is present). This means:
- Magic link first login → CRM user created/linked, role synced
- Credentials login → same flow

Both paths eventually store `tenantId` in the JWT, which propagates to the session.

---

## 2026-04-01 AM — `useActionState` vs `useFormState` in React 19 [react], [dx]

### What I Learned

React 19 renamed `useFormState` (from React 18 canary/Next.js 14) to `useActionState`. Both have the same signature:

```typescript
const [state, action, isPending] = useActionState(
  myServerAction,    // async function (prevState, formData) => newState
  initialState,       // passed as prevState on first call
  // extraArgs?         // passed to action when called
)
```

**Important for our usage:** `useActionState` receives the form's `FormData` as the second argument to the server action. The server action signature is `(prevState, formData) => newState`. The `formData` is passed automatically when the form's `action` attribute points to the server action.

In the settings form:
```typescript
<form action={action}>  // action = updateProfileAction
  <input name="name" />
</form>

// Server action receives (prevState, formData)
async function updateProfileAction(prevState, formData: FormData) {
  const name = formData.get("name") as string
  // ...
  return { success: "..." }
}
```

This is cleaner than `useFormState` + manual `FormData` construction because there's no need for refs or event handlers on submit buttons.

---

## 2026-04-01 AM — CSS Custom Property Cascade + Per-Tenant Theming in Tailwind v4 [dx], [arch]

### What I Learned

**The CSS cascade and custom properties:**

When you declare a CSS custom property (variable) in a parent element and reference it in a child, the child reads the parent's value. But if you declare the *same* custom property multiple times in the same scope (`:root`), the *last* declaration wins.

**The globals.css bug found:**

The portal's `globals.css` had this in `:root`:
```css
--accent: #6366F1;       /* line 57 — CT Website Co. indigo (CORRECT) */
--secondary: oklch(...); /* line 62 */
--accent: oklch(gray);   /* line 63 — BUG: should be --accent-foreground */
```

Because line 63 redeclares `--accent` as grayish, the *effective* value of `--accent` in `:root` was gray, NOT indigo. This was a subtle bug that happened to NOT break the portal because all portal components (`PortalSidebar`, `PortalMobileNav`) apply `--accent` via inline `style="--accent: #HEX"`, which overrides the cascade.

**Why inline style > CSS class for dynamic per-tenant values:**

When you do `style={{ "--accent": accentColor }}` on a React component, you're setting the CSS custom property directly on that DOM element. CSS custom properties inherit — so all descendants that use `var(--accent)` will read the value from the nearest ancestor that defines it. This means:

```tsx
// Setting on the sidebar element — active nav items inside see this value
<aside style={{ "--accent": accent } as CSSProperties}>
  <NavLink className={cn(active && "bg-[var(--accent)]/10 text-[var(--accent)]")} />
</aside>

// Mobile nav — sets it on the nav element
<nav style={{ "--accent": accent } as CSSProperties}>
  <BottomTab className={cn(isActive && "text-[var(--accent)]")} />
</nav>
```

Both work correctly because each component sets `--accent` on itself (not on a common parent). Sibling components can't share a CSS var from a common parent unless that parent wraps both in the DOM tree.

**The Tailwind `bg-[var(--name)]` syntax:**

`bg-[var(--accent)]` is a Tailwind arbitrary value. It generates a CSS class:
```css
.bg-\[var\(--accent\)\] { background-color: var(--accent); }
```

This class is generated at build time; the value is resolved at runtime by the browser reading `var(--accent)` from the cascade. ✅ Works with inline style overrides.

### How It Applies to This Project

Fixed `globals.css` to have a single `--accent: #6366F1` declaration in `:root` with a comment explaining that portal components override it inline. This prevents future confusion if someone adds a component that uses `var(--accent)` without an inline override.

Architecture: per-tenant `--accent` works because sidebar and mobile-nav set it inline on their own root elements. No shared parent needed. The header uses `style={{ backgroundColor: accent }}` directly (doesn't use `--accent` variable) — this is equivalent and also correct.

---

## 2026-04-01 AM — Feature Flag Architecture: JWT Embedding for Edge Runtime [arch]

### What I Learned

**The core problem:** Feature flags are stored in Prisma (SQLite). Middleware runs on Next.js Edge Runtime which CANNOT use Prisma (no Node.js APIs, no filesystem). So middleware can't check flags directly.

**The JWT embedding solution (already implemented):**

In `lib/auth.ts`, the `jwt` callback fetches enabled features and embeds them in the JWT token:
```typescript
async jwt({ token, user }) {
  if (user) {
    token.tenantId = crmUser?.tenant_id ?? null
    // ...
  }
  if (token.tenantId) {
    const features = await getEnabledFeatures(token.tenantId as string)
    token.enabledFeatures = features  // Embed in JWT
  }
  return token
}

async session({ session, token }) {
  session.user.enabledFeatures = token.enabledFeatures as Record<string, boolean>
  return session
}
```

In middleware:
```typescript
const enabledFeatures = session.user?.enabledFeatures
if (!isFlagEnabled(enabledFeatures, requiredFlag)) {
  return NextResponse.redirect(dashboardUrl)
}
```

**Why this is the right architecture:**
- ✅ Works on Edge Runtime (JWT is just JSON, readable without Prisma)
- ✅ Flag values are cached in the JWT (expires with the session, typically 24h)
- ✅ Flag changes propagate when the JWT refreshes (next login or session refresh)
- ⚠️ Flag changes take up to the JWT lifetime to propagate (not instant, but ≤ 24h)

**The cache TTL trade-off:**

The Prisma-backed `getEnabledFeatures()` has a 60s in-memory cache. The JWT has a 24h lifetime. So worst case:
- Toggle flag in admin → propagates within 60s to new serverless invocations
- But users with an existing JWT keep the old flags until their JWT expires (≤ 24h)

For a Phase 0 feature flag system, this is acceptable. For production, you'd want shorter JWT lifetimes or a webhook-based JWT invalidation on flag change.

**Route → flag mapping in middleware:**
```typescript
const ROUTE_FEATURE_MAP: Partial<Record<string, FeatureKey>> = {
  "/studio": "studio",
  "/support": "support",
  "/billing": "billing",
  "/content/tv-feed": "tv_feed",
  "/content/media": "media_library",
  "/content": "content_hub",
}
```

Uses longest-prefix matching so `/content/tv-feed` matches `tv_feed` (not `content_hub`).

---

## 2026-04-01 AM — Next.js App Router Route Groups + Route Layout Isolation [arch]

### What I Learned

**Route groups (folder names in parentheses) don't create URL paths.**

The portal has:
- `app/(auth)/` — auth routes (login, verify, onboarding) — uses auth layout
- `app/(portal)/` — portal routes (dashboard, billing, support) — uses portal layout (sidebar + header)
- `app/studio/` — Studio (outside portal layout — full screen Sanity chrome)

**Why studio is outside `(portal)`:**
If studio were inside `(portal)`, it would be wrapped by `PortalLayout` (sidebar + header), and the Sanity Studio chrome would be nested inside the portal chrome. This is wrong — Sanity Studio provides its own navigation.

**Route matching priority:**
Next.js matches routes by specificity, not by folder group. `/studio` matches `app/studio/[[...tool]]/page.tsx` regardless of where it is in the folder hierarchy.

**Layout nesting:**
When a route is inside a route group, it uses the group's layout. When outside any group, it uses the root `app/layout.tsx`. The `PortalLayout` is NOT applied to `app/studio/` — correct.

**The layout chain for `/studio`:**
`app/layout.tsx` (root) → `app/studio/[[...tool]]/page.tsx` (no intermediate layout)

**The layout chain for `/dashboard`:**
`app/layout.tsx` → `app/(portal)/layout.tsx` (sidebar + header) → `app/(portal)/dashboard/page.tsx`

---

## 2026-04-01 AM — Multi-Tenant SaaS: Subdomain vs. Path-Based Routing [arch]

### What I Learned

**The portal supports both:**

1. **Subdomain routing** (`demo.ctwebsiteco.com`) — extracted by `extractSubdomain()` in `lib/tenant.ts`, used by `middleware.ts` to resolve tenant before auth.

2. **Path-based fallback** (`ctwebsiteco.com/s/demo`) — `app/s/[subdomain]/page.tsx` renders the portal for a given subdomain via URL path. Used when DNS subdomain isn't configured yet.

**How the middleware resolves the tenant:**
```typescript
const subdomain = extractSubdomain(hostname)  // e.g. "demo" from "demo.ctwebsiteco.com"
const { tenant, type } = await getTenantBySubdomain(subdomain)
```

The `getTenantBySubdomain` function first checks Redis for a cached subdomain→tenant mapping (the authoritative CRM source), then falls back to Prisma if not in Redis.

**Why two sources (Redis + Prisma)?**
Redis is the fast path (subdomain config cached there by the CRM when a client configures DNS). Prisma is the persistent store (source of truth for the portal's tenant DB). If Redis is empty, the portal still works by querying Prisma directly.

**Path-based fallback (`/s/[subdomain]`):**
The `s` stands for "static" or "site". This route exists so that even without DNS configuration, a client can access their portal via `domain.com/s/client-slug`. The admin assigns the subdomain in the CRM, but if DNS isn't set up yet, this path-based URL provides access.

This is a common pattern in multi-tenant SaaS: subdomain-first, path-based fallback.
