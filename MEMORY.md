# MEMORY.md — Long-Term Memory

## Important Rules

**Do NOT push code to git.** Keep knowledge local only. Do not run `git push` or any git push operations. If I've pushed code in the past, that was before this rule was set — going forward, do not push.

## Who I'm Helping

- **Name:** Sean Conway
- **Contact:** +1 879-430-6096 (Telegram)
- **GitHub:** SeanConway102
- **Timezone:** likely Eastern

## CRM System (ctwebsiteco)

### Access
- **CRM Frontend:** https://v0-crm-frontend-build-peach.vercel.app
- **CRM API:** https://crm-api-1016182607730.us-east1.run.app/mcp
- **Credentials:** sully@ctwebsiteco.com / SullyAgent2026
- **API Key:** `crm_9c69fddd3b6c57f3ef938c5acc42c52d1fa894ac00879b7de281ba214d97a1ec`

### GitHub
- **crm-frontend:** https://github.com/SeanConway102/crm-frontend
- **crm (backend):** https://github.com/SeanConway102/crm
- **PATs** stored in `~/.git-credentials`

### CRM Architecture
- `status` vs `stage_id` — two parallel fields; stage drives the board view, status is legacy
- Pipeline stages: Backlog, To Do, Open, Blocked, In Progress, In Review, Resolved, Closed, Cancelled
- Resolved stage_id: `6fe05243-8760-4604-aeff-166f56f19a45`

### Bug Reports (not yet fixed)
1. Duplicate fairwayirrigationandlawn.com entry (two rows, scores 74 and 95)
2. Sites Lighthouse scores are stale
3. Some site integration links show `href="#"`
4. Dashboard shows all 0s for metrics
5. Unused `statusOptions` variable in ticket detail page
6. `handleStatusChange` is a no-op stub

## Client Portal Project (new — 2026-03-31)
**Repo:** Not yet created (Sean will provide git URL)
**Local path:** `~/clawd/agency/client-portal/`
**Spec:** `agency/client-portal/SPEC.md`

### Concept
Multi-tenant white-label client dashboard where Sean's clients:
- Edit their Sanity-powered website (embedded Sanity Studio + Visual Editing)
- Manage their satellite TV feed content
- File support tickets (→ CRM)
- Manage billing (Stripe Customer Portal)

### Tech
- Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui
- NextAuth.js v5 — credentials provider wired to existing CRM users table
- Prisma (portal's own DB for tenant registry + portal users)
- `next-sanity` — embedded Studio at `/[tenant]/studio`
- Stripe Customer Portal for billing self-service
- Path-based multi-tenancy: `/[tenant]/dashboard`, `/[tenant]/studio`, etc.
- Middleware resolves tenant from path + validates auth

### Phases
1. Foundation: scaffold + auth + portal shell
2. Sanity Studio embed + visual editing
3. Support tickets (CRM API)
4. Billing (Stripe Portal)
5. Content hub + TV feed placeholder

### Key Decisions (confirmed)
- Domain: `portal.ctwebsiteco.com` (agency) + `admin.{clientdomain}.com` per client (subdomain-based, confirmed 2026-03-31)
- TV Feed: Phase 6 (end) — it's a video + streaming management platform; full spec TBD
- Onboarding: site built first → client invited to portal with pre-configured tenant (confirmed)
- Template: **Vercel Platforms** (`vercel/platforms`, free) — multi-tenancy, shadcn/ui, Next.js 15
- Auth: Magic link (NextAuth Email) + optional password on first login. Password setup on `/onboarding`. Portal users are NOT CRM users — separate user management.
- Billing: CRM owns subscriptions + invoices. Portal reads status, embeds Stripe Elements payment form on `/billing` when `past_due` or `incomplete`. Webhook forwards to CRM, updates local cache.
- No trials — pay upfront. Manual one-by-one onboarding by Sean via agency portal.
- Sanity: embedded Studio, 100% CT Website Co. branded. CRM is source of truth — portal tenant links to CRM site ID → fetches Sanity credentials (projectId, token, dataset) from CRM API. Some existing CRM clients already have Sanity projects (CRM stores `sanity_project_id` per site). Custom per-client schemas, config factory `createSanityConfig(tenant)`.
- Feature flags: per-tenant, managed via admin UI. `FeatureFlag` + `TenantFeatureFlag` Prisma models. Flags: `studio`, `support`, `billing`, `content_hub`, `tv_feed`, `media_library`. Enforced in middleware + page components. `lib/features.ts`.
- TDD: Vitest (unit/integration) + Cucumber + Playwright (BDD E2E).
- TV Feed: Phase 6 — video + streaming management platform (separate product).

## OpenClaw Setup
- Running on `agency-claw` server (Linux 6.8.0-106-generic x64)
- Chrome at `/usr/bin/google-chrome-stable`
- Config at `~/.openclaw/openclaw.json`

## Changes Made Today (2026-03-30)

### Billing System Redesign
Complete UX overhaul of all billing pages (invoices, subscriptions, payments, billing dashboard):

**New files:**
- `lib/billing-utils.ts` — shared billing computations (computeMrr, groupInvoicesByAging, buildInvoiceAlerts, etc.)
- `lib/billing-context.tsx` — BillingDataProvider, single shared fetch for all billing pages
- `components/billing-metric-card.tsx` — consistent metric card component
- `components/billing-alerts.tsx` — severity-coded alert queue
- `components/invoice-aging-card.tsx` — invoice aging with at-risk callout
- `components/mrr-waterfall.tsx` — MRR movement breakdown
- `components/subscription-health-card.tsx` — retention bar + segments
- `components/recent-invoices-card.tsx` — quick invoice list

**Key fixes:**
- Invoice aging now uses `due_date` instead of `created` (was a bug)
- computeMrr deduplicated from 4 copies into billing-utils.ts
- BillingDataProvider eliminates redundant parallel API calls

**Pushed to:** SeanConway102/crm-frontend (master)

### Sidebar + Billing Pages Consolidation (2026-03-30)
- Sidebar billing section reduced from 5 links to 2: `Billing` + `Products`
- `/revenue` now redirects to `/billing`
- `/billing` is now a single unified page with 4 tabs: Overview / Invoices / Subscriptions / Payments
- `/invoices`, `/subscriptions`, `/payments` standalone pages still exist (accessible via "View →" links inside billing tabs), just not in sidebar
- `/products` kept in sidebar as separate link (catalog management)
- No git push (per Sean's rule)

### Testing Done (2026-03-30) — local dev server `http://localhost:3456`
All tests PASSED:
- ✅ Sidebar: Billing section shows only "Billing" + "Products"
- ✅ `/revenue` → redirects to `/billing`
- ✅ Billing Overview tab: KPI cards (MRR, Active Subs, Outstanding, Balance), Revenue chart, MRR Movement, Invoice Aging, Subscription Health all render
- ✅ Invoices tab: search box, empty state, "New Invoice" button, "Create one" button work
- ✅ Subscriptions tab: search box, status filter chips (All/Active/Trial/Past Due/Canceled), "New Subscription" button work
- ✅ Payments tab: search box, status filter chips (All/Succeeded/Processing/Failed), timeline view work
- ✅ New Invoice sheet opens correctly (customer select, collection method, days until due, description, footer, line items)
- ⚠️ Stripe not configured in sandbox — all data shows $0.00/empty (expected)

### Lighthouse Audit (2026-03-31)
Full audit of 19 client sites completed. 9 sites critical (<60 perf), 13 new CRM tickets filed.
- Critical: DMarie's Pizza (27), Townsend Agency (25), Manhattan Southington (43), Refillpen (42), Chai for Congress (51), Brimatco (56), Middlebury Contracting (57), Southington Gardens (59), A&B Entertainment (60)
- Known good: Pals (93), Fairway (68), Li Zhai (69), Tax Career (71), Salisbury (78)
- Energy Busters regressed from 95+ to 62 — re-audit needed
- Reports stored: `memory/lh-audit/`
