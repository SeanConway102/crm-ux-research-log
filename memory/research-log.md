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

// Client Component: apply CSS variable inline
<div style={{ "--accent": accentColor } as CSSProperties}>
  <nav className="bg-[var(--accent)]">...</nav>
</div>
```

---

## 2026-04-01 AM — Dashboard Quick Action Feature Flag Gap [dx], [ux]

### What I Found

The portal's sidebar nav correctly hides feature-gated items via `enabledFeatures` filtering. BUT the dashboard's quick action buttons (`Edit website content` → Studio, `File a support ticket` → Support, `View billing & invoices` → Billing) are hardcoded and shown unconditionally.

**Bug:** A tenant with `studio: false` still sees "Edit website content" on their dashboard.

### What I'm Building (this session)

1. **Feature-flag-gated quick actions** — filter the Quick Actions card buttons by enabled features
2. **Time-based greeting** — "Good morning/afternoon/evening, {firstName}" using server-side UTC hour
3. **Real subscription data** — fetch `getCrmSubscription()` for the Plan card instead of hardcoded "Pro / Apr 15"
4. **Real site status** — fetch `getCrmSite()` for the Site Status card instead of hardcoded "Active"

### Research Sources
- `lib/crm-api.ts` exposes `getCrmSubscription(tenantId)` and `getCrmSite(siteId)` — both return `null` on error, so dashboard degrades gracefully
- `lib/features.ts` `getEnabledFeatures(tenantId)` is already imported in layout.tsx — same pattern for dashboard

---

## 2026-04-01 AM — SaaS Feature Flag Patterns [arch], [billing]

### Key Insights from SaaS Feature Flag Guide (designrevision.com)

**4 types of SaaS flags:**
1. **Release** (days-weeks) — gate unfinished features during development. Remove within 30 days of 100% rollout.
2. **Experiment** (weeks-months) — A/B tests. Remove after statistical significance reached.
3. **Ops/Kill Switch** (permanent) — disable features during incidents. Every SaaS needs kill switches on payment processing and third-party APIs.
4. **Permission** (permanent) — subscription tier gating. The most direct revenue impact.

**Our portal flags are primarily Permission type** — they gate features by subscription tier (client plan). This is correct.

**Our portal has NO Kill Switch flags yet.** We should consider adding:
- `stripe_enabled` — kill switch for Stripe billing
- `crm_integration_enabled` — kill switch for CRM ticket API
- `sanity_enabled` — kill switch for Sanity Studio

**Server-side evaluation is critical** for permission/tier flags (security). Client-side evaluation is fine for UI experiments. Our current architecture (JWT-embedded features read by middleware on Edge) is the right approach for permission flags.

**Flag audit cadence:** 50-100 active flags is the practical ceiling before technical debt. Quarterly audits recommended.

