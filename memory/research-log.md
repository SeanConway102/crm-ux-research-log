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
