# memory/graph.md — Entity Graph

## Entities

### People
- **Sean Conway** → GitHub: SeanConway102 | Telegram: +1 879-430-6096 | Email: srconway0@gmail.com

### Projects
- **client-portal** → type: web-app | tenant: ctwebsiteco | status: active | phases: 0✅ 1🔄 6🔄
- **crm-frontend** → type: crm-frontend | tenant: ctwebsiteco | status: active | url: https://v0-crm-frontend-build-peach.vercel.app
- **crm (backend)** → type: api | tenant: ctwebsiteco | status: active | url: https://crm-api-1016182607730.us-east1.run.app

### Tools & Libraries
- **NextAuth v5** → used in: client-portal | purpose: auth (magic link + password)
- **Prisma** → used in: client-portal | purpose: ORM + feature flag DB
- **Vercel Platforms** → used in: client-portal | purpose: multi-tenancy template
- **Stripe** → used in: client-portal | purpose: billing (Customer Portal + Elements)
- **Sanity** → used in: client-portal | purpose: embedded Studio + Visual Editing
- **Tailwind v4** → used in: client-portal | purpose: CSS + per-tenant theming
- **Zod v4** → used in: client-portal | purpose: form validation
- **bcryptjs** → used in: client-portal | purpose: password hashing
- **@vercel/flags** → deferred | purpose: middleware feature flag enforcement (needs Edge Config)
- **gtag.js** → used in: Fairway Irrigation site | purpose: analytics (replaced @next/third-parties)

### Feature Flags (client-portal)
- **studio** → flag-key | label: "Sanity Studio"
- **support** → flag-key | label: "Support Tickets"
- **billing** → flag-key | label: "Billing"
- **content_hub** → flag-key | label: "Content Hub"
- **tv_feed** → flag-key | label: "TV Feed"
- **media_library** → flag-key | label: "Media Library"

### Pages / Routes (client-portal)
- **/[tenant]/dashboard** → phase: 0 | status: ✅
- **/[tenant]/studio** → phase: 1 | status: 🔄 (missing — Phase 1)
- **/[tenant]/support** → phase: 1 | status: 🔄 (missing list page — Phase 1)
- **/[tenant]/support/[id]** → phase: 1 | status: 🔄 (missing detail page — Phase 1)
- **/[tenant]/support/new** → phase: 0 | status: ✅
- **/[tenant]/billing** → phase: 0 | status: ✅
- **/[tenant]/content** → phase: 0 | status: ✅
- **/[tenant]/content/tv-feed** → phase: 5 | status: ✅ (placeholder)
- **/[tenant]/settings** → phase: 6 | status: ✅
- **/admin/clients/[tenantId]** → phase: 0 | status: ✅ (feature flag admin UI)
- **/login** → phase: 0 | status: ✅

### CRM Clients (Lighthouse Audit — 2026-03-31)
- **DMarie's Pizza** → lh-score: 27 | status: critical
- **Townsend Agency** → lh-score: 25 | status: critical
- **Manhattan Southington** → lh-score: 43 | status: critical
- **Refillpen** → lh-score: 42 | status: critical
- **Chai for Congress** → lh-score: 51 | status: critical
- **Brimatco** → lh-score: 56 | status: critical
- **Middlebury Contracting** → lh-score: 57 | status: critical
- **Southington Gardens** → lh-score: 59 | status: critical
- **A&B Entertainment** → lh-score: 60 | status: critical
- **Fairway Irrigation** → lh-score: 68 | status: known | deploy-fixed: 2026-04-01
- **Li Zhai** → lh-score: 69 | status: known
- **Tax Career** → lh-score: 71 | status: known
- **Salisbury** → lh-score: 78 | status: known
- **Pals Power Washing** → lh-score: 93 | status: known-good

### CRM Pipeline Stages
Backlog → To Do → Open → Blocked → In Progress → In Review → Resolved → Closed → Cancelled
- Resolved stage_id: `6fe05243-8760-4604-aeff-166f56f19a45`

## Relationships
- **client-portal** —uses→ **Prisma** (feature flags, tenant registry)
- **client-portal** —uses→ **NextAuth v5** (auth)
- **client-portal** —uses→ **Sanity** (CMS Studio)
- **client-portal** —uses→ **Stripe** (billing)
- **client-portal** —reads-from→ **crm-api** (site credentials, subscription status)
- **crm-frontend** —mirrors→ **crm backend**
- **client-portal** —seeds→ **FeatureFlag** (6 flags: studio, support, billing, content_hub, tv_feed, media_library)
- **feature-flag-toggles** (admin UI) —wraps→ **setFeatureFlag** (lib/features.ts)
- **middleware.ts** —reads-from→ **JWT.enabledFeatures** (set by lib/auth.ts at sign-in)
- **Fairway Irrigation deploy** —fixed-by→ gtag.js (replaced @next/third-parties, 2026-04-01)

## Patterns
- **Middleware/Prisma incompatibility** (2026-03-31): Edge Runtime cannot use Prisma; page-level enforcement correct; Edge Config needed for middleware-level
- **Duplicate CSS var bug** (2026-04-01): `--accent` declared twice in globals.css; causes cascade conflicts
- **Session ID propagation** (2026-04-01): NextAuth requires explicit `token.id → session.user.id` in callbacks; not automatic
- **Wrong git author email** (2026-04-01): `openclaw@openclaw.ai` / `noreply@anthropic.com` in 4 repos; fixed with `git filter-repo`
- **@next/third-parties v16 incompatibility** (2026-04-01): requires Next.js `^13-15`; replaced with vanilla gtag.js

## Archived / Resolved
- **MLS Realty Feed** (CRM ticket ac1cfb62) — no repo, needs manual work
- **Mirrored Sites XML** (CRM ticket 8268e7cd) — no repo, needs manual work
- **Energy Busters regressed** (95+ → 62) — re-audit needed but not yet done
- **@next/third-parties → gtag.js fix** (Fairway Irrigation) — resolved 2026-04-01
