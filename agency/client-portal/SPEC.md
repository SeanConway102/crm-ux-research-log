# Client Portal — SPEC.md

**Project:** CT Website Co. Client Portal
**Type:** Multi-tenant SaaS client dashboard
**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma
**Status:** Planning — not yet initialized

---

## 1. Concept & Vision

A unified, white-label client portal where Sean's clients manage everything about their digital presence in one place: editing their Sanity-powered website, managing their satellite TV feed, filing support tickets, and handling billing. The portal feels like a premium SaaS product — not a Frankenstein mashup of disconnected tools. Clients log into one URL and never feel like they're leaving the product.

**The core promise:** *One portal, everything your client needs to manage their digital presence.*

---

## 2. Design Language

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `brand` | `#6366F1` (Indigo 500) | Primary CT Website accent |
| `brand-dark` | `#4F46E5` (Indigo 600) | Hover states |
| `brand-light` | `#EEF2FF` (Indigo 50) | Subtle backgrounds |
| `bg` | `#FAFAFA` | Page background |
| `surface` | `#FFFFFF` | Cards, panels |
| `border` | `#E5E7EB` | Dividers, borders |
| `text-primary` | `#111827` | Headings |
| `text-muted` | `#6B7280` | Secondary text |

*Override-able per-client via a `theme` field on the tenant (accent color, logo).*

### Typography
- **Font:** Inter (Google Fonts) — clean, professional, excellent legibility at small sizes
- **Headings:** `text-xl` to `text-3xl`, font-semibold
- **Body:** `text-sm` (UI elements), `text-base` (descriptions)
- **Monospace:** JetBrains Mono for code snippets (TV feed XML/JSON editors)

### Spatial System
- **Base unit:** 4px (Tailwind default)
- **Card padding:** `p-5` or `p-6`
- **Section gaps:** `gap-4` to `gap-6`
- **Page max-width:** `max-w-7xl mx-auto`

### Motion
- **Transitions:** `transition-colors duration-150` for interactive elements
- **Sheet/drawer:** slide-in from right, `duration-200`
- **Page transitions:** minimal — just fade, `duration-150`
- **Loading states:** skeleton shimmer, not spinners

### Visual Assets
- **Icons:** Lucide React (consistent stroke weight, clean)
- **Empty states:** Simple centered illustration + helpful CTA
- **Badges:** Rounded pill badges for status labels

---

## 3. Architecture

### 3.1 Multi-Tenancy

**Approach:** Subdomain-based routing — each client gets their own branded subdomain; the agency has its own dedicated domain.

```
portal.ctwebsiteco.com              → Agency's internal portal (manage all clients, onboarding, billing)
admin.acmecorp.clientsite.com      → Client A's portal (studio, content, support, billing)
admin.anotherclient.com            → Client B's portal
```

**Why subdomains per client?**
- `admin.clientsite.com` feels owned by the client, not CT Website Co.
- Vercel handles SSL automatically per subdomain (wildcard cert — no extra setup)
- Standalone, shareable URL per client
- Agency's `portal.ctwebsiteco.com` uses the same app, same code, different tenant context

**DNS:** Each client configures a wildcard CNAME: `*.clientsite.com` → Vercel deployment. For clients already on Vercel, this is one DNS record. For others, we provide a one-page setup guide.

**Tenant Resolution Middleware:**
```
middleware.ts intercepts every request:
  → extract subdomain from Host header
     e.g. "admin.acmecorp.clientsite.com" → tenant slug "acmecorp"
     e.g. "portal.ctwebsiteco.com" → special agency tenant "agency"

  → if agency subdomain: render agency dashboard (list all clients, manage onboarding)
  → if client subdomain: validate tenant in DB, inject tenant context
  → auth guard: redirect to tenant's login if unauthenticated
```

**Data Isolation:**
- Sanity: each tenant has its own Sanity project/dataset
- CRM tickets: tenant_id column on all records (already designed this way in existing CRM)
- Billing: tenant_id foreign key on Stripe customer records
- Portal DB: separate Prisma schema; tenant list synced from CRM

**Tenant types:**
| Type | Subdomain | Access |
|---|---|---|
| `agency` | `portal.ctwebsiteco.com` | Internal — all client tenants, onboarding, agency-level billing |
| `client` | `admin.{clientdomain}.com` | Per-client — studio, content, support, billing |

### 3.2 App Structure

Subdomain routing means the route tree is at the root — no `[tenant]` segment. Tenant context comes from middleware, not the URL.

```
client-portal/
├── prisma/
│   └── schema.prisma          # Portal DB (tenants, portal users)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── agency/login/page.tsx     # portal.ctwebsiteco.com/login
│   │   │   ├── client/login/page.tsx     # admin.clientsite.com/login
│   │   │   └── layout.tsx
│   │   ├── (portal)/
│   │   │   ├── layout.tsx               # Root layout: sidebar + header
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── studio/[[...tool]]/page.tsx   # Embedded Sanity Studio
│   │   │   ├── content/
│   │   │   │   ├── page.tsx
│   │   │   │   └── tv-feed/page.tsx
│   │   │   ├── support/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx
│   │   │   │   └── invoices/page.tsx
│   │   │   └── admin/                   # Agency-only: client management
│   │   │       ├── page.tsx             # Client tenant list
│   │   │       └── [tenantId]/page.tsx # Per-client tenant settings
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── tenant/route.ts          # GET: resolve tenant from subdomain
│   │   │   ├── tickets/route.ts
│   │   │   └── billing/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── portal/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── tenant-provider.tsx
│   │   │   └── client-admin-table.tsx  # Agency view: all client tenants
│   │   └── domain/
│   │       ├── studio-embed.tsx
│   │       ├── ticket-form.tsx
│   │       ├── ticket-list.tsx
│   │       ├── billing-overview.tsx
│   │       └── tv-feed-editor.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── sanity-client.ts
│   │   ├── stripe-client.ts
│   │   ├── crm-api.ts
│   │   └── tenant.ts            # subdomain → tenant record resolver
│   └── middleware.ts
├── sanity.config.ts
└── package.json
```

**Tenant context in server components:**
Middleware extracts tenant from subdomain, stores in a server-side context (not URL params). All server components read tenant from `const { tenant } = await getTenantContext()` — no prop drilling through `[tenant]` segments.

**Agency vs Client views:**
Both use the same route tree. Middleware checks `session.user.role`:
- `role: agency` → renders agency layout (sidebar shows "All Clients" admin link)
- `role: client` → renders client layout (sidebar shows their portal pages)

**Local dev without subdomains:** Use `NEXT_PUBLIC_USE_PATH_TENANT=acmecorp` env var to simulate a tenant via path; or use `next dev --tunnel` with a real subdomain tunnel.
├── .env.local                   # Local env vars (gitignored)
└── package.json
```

### 3.3 Authentication

**Provider:** NextAuth.js v5 (Auth.js)

**Flow:**
1. Client portal users exist in CRM DB (already has users table with email/password)
2. NextAuth Credentials provider calls CRM API to validate credentials
3. On success, JWT issued containing: `{ userId, tenantId, email, role: "client" }`
4. Portal uses `useSession()` from NextAuth everywhere

**Roles:**
| Role | Access |
|---|---|
| `owner` | Full access — content, support, billing |
| `editor` | Content only (studio + TV feed) |
| `billing_viewer` | Billing read-only |
| `support_requester` | Support tickets only |

**Login URL:** `/[tenant]/login` — each tenant gets their own branded login page.

### 3.4 Sanity Integration

**Approach: Embedded Sanity Studio (via `next-sanity`)**

```
Sanity Studio mounted at: /[tenant]/studio
```

Each tenant's Sanity project has its own:
- `projectId` (stored in tenant DB record)
- `dataset` (typically `production`)
- API token (Viewer token for editors, Admin token for owners)

**Tenant config in Sanity:**
```typescript
// sanity.config.ts — driven by tenant context
export default defineConfig({
  basePath: `/[tenant]/studio`,
  projectId: tenant.sanityProjectId,
  dataset: tenant.sanityDataset,
  plugins: [structureTool(), ...],
  schema: { types: tenantSchemaTypes },
})
```

**Visual Editing (Sanity Presentation):**
Sanity's Presentation tool + Visual Editing gives a "click on the live website to edit content" experience. This is the closest thing to a "visual page editor" without building a custom drag-drop builder from scratch.

```
Client visits: /[tenant]/studio/presentation/[pageId]
  → Live preview of their website renders inside Studio frame
  → Click any element → Sanity field opens for editing
  → Changes save directly to Sanity → reflected immediately on website
```

**This is the Phase 1 "visual editor"** — pragmatic, no custom UI to build, leverages Sanity's own tooling.

### 3.5 CRM Integration (Tickets)

- Portal talks to existing CRM via internal API calls (same API Sean's team uses internally)
- `POST /api/tickets` → creates ticket in CRM with `tenant_id` set
- Ticket form includes: subject, description, priority, attachment (optional)
- Portal ticket list shows all tickets for the tenant's `tenant_id`
- Status: `open | in_progress | resolved | closed` — rendered as colored badges

### 3.6 Billing Integration

- Stripe as the billing backend (already in use by CRM)
- Each tenant has a `stripeCustomerId` in the tenant DB
- Portal uses **Stripe's Customer Portal** (hosted page) for self-service billing management
  - Update payment method
  - View/download invoices
  - Cancel subscription
  - This avoids building a full billing UI — Stripe hosts it for free
- Portal's billing page shows: current plan, next invoice date, quick links to Stripe portal

### 3.7 TV Feed Management

*Scope: "satellite TV feed" management. Details TBD — placeholder for Phase 2.*

Assumption: This is a content feed (TV program schedule, weather, news tickers) that clients can update through an admin UI. The feed is likely stored in Sanity or delivered via a separate API.

**Phase 1 placeholder:** Just a "TV Feed" page in the sidebar with a note that it's coming soon.

---

## 4. Features & Interactions

### 4.1 Dashboard (`/[tenant]/dashboard`)

**What it shows:**
- Welcome message: "Welcome back, {firstName}"
- Quick stats cards: Open Tickets, Latest Invoice, Site Status
- Recent activity feed (last 5 tickets)
- Quick action buttons: "Edit Site", "New Ticket", "View Invoice"

**Interactions:**
- Clicking a stat card navigates to the relevant section
- All data fetched server-side via RSC or client-side SWR

### 4.2 Site Studio (`/[tenant]/studio`)

**What it is:**
- Full embedded Sanity Studio via `<NextStudio config={config} />`
- Route: `src/app/(portal)/[tenant]/studio/[[...tool]]/page.tsx`
- Config driven by tenant's Sanity credentials (projectId, dataset, token)

**What clients can do:**
- Edit all content types defined in their Sanity schema (pages, blog posts, images, etc.)
- Use Presentation tool for visual page editing (click-on-live-site editing)
- Manage media library
- Schedule content (if Sanity's scheduling plugin added)

**Auth guard:** Middleware checks `session.user.role` — only `owner` and `editor` roles can access `/studio`.

### 4.3 Content Pages (`/[tenant]/content`)

**Overview page:**
- Grid of content types with counts: Pages (12), Blog Posts (34), Authors (5), etc.
- Quick links to each content type in Sanity Studio

**TV Feed page (placeholder):**
- "TV Feed Management coming soon" empty state
- Form to collect requirements (name, description, current feed URL, feed format)
- Submits as a support ticket with tag `tv-feed-request`

### 4.4 Support (`/[tenant]/support`)

**Ticket list (`/[tenant]/support`):**
- Filterable list: All | Open | In Progress | Resolved
- Search by subject
- Each row: subject, status badge, priority, created date, assignee
- Click row → ticket detail page (`/[tenant]/support/[id]`)

**New ticket form (`/[tenant]/support/new`):**
- Fields: Subject (required), Description (rich text, required), Priority (select: Low/Medium/High/Urgent), Attachment (optional, drag-drop)
- On submit: `POST /api/tickets` → CRM API creates ticket
- Success: redirect to ticket list with success toast

**Ticket detail (`/[tenant]/support/[id]`):**
- Ticket metadata (subject, status, priority, created, assignee)
- Thread of comments/activities
- Comment input at bottom (adds note to ticket in CRM)

### 4.5 Billing (`/[tenant]/billing`)

**Overview page:**
- Current plan card: plan name, price, renewal date, status badge (Active/Canceled/Trial)
- "Manage Billing" button → opens Stripe Customer Portal (hosted Stripe page)
- Next invoice preview: amount, due date
- Last 3 invoices table: date, amount, status (Paid/Open/Void)

**Invoices page (`/[tenant]/billing/invoices`):**
- Full invoice history
- Each row: invoice #, date, amount, status, PDF download link
- Pagination

### 4.6 Navigation

**Sidebar (desktop):**
- Logo + tenant name at top
- Nav items with icons:
  - Dashboard (LayoutDashboard)
  - Site Editor (Monitor) → links to `/studio`
  - Content (FileText)
  - Support (LifeBuoy)
  - Billing (CreditCard)
- Settings at bottom
- Collapsible to icon-only mode

**Header (top bar):**
- Tenant name/branding on left
- User avatar + name dropdown on right: Profile, Sign Out
- Optional: notification bell (future)

**Mobile (bottom nav):**
- 5 items max: Dashboard, Studio, Content, Support, Billing
- Active state: filled icon + brand color

---

## 5. Component Inventory

### shadcn/ui Components Used
- `button` — primary, secondary, outline, ghost, destructive variants
- `input`, `textarea` — form fields
- `select`, `select-trigger`, `select-content`, `select-item`
- `card`, `card-header`, `card-title`, `card-content`, `card-footer`
- `badge` — status badges (green/yellow/red/gray)
- `avatar` — user avatars in header and ticket list
- `sheet` — mobile nav drawer + ticket detail side panel
- `dialog` — confirmation dialogs, inline edit modals
- `tabs`, `tabs-list`, `tabs-trigger`, `tabs-content`
- `skeleton` — loading states
- `separator` — section dividers
- `dropdown-menu` — user menu, action menus
- `label` — form labels
- `table`, `table-header`, `table-row`, `table-head`, `table-body`, `table-cell`

### Custom Components

| Component | Purpose | States |
|---|---|---|
| `PortalSidebar` | Left nav with tenant branding | expanded, collapsed, mobile-drawer |
| `PortalHeader` | Top bar with user menu | default |
| `StatCard` | Dashboard metric cards | default, loading (skeleton) |
| `TicketRow` | Single ticket in list | default, hover, selected |
| `TicketForm` | New/edit ticket form | idle, submitting, success, error |
| `BillingPlanCard` | Current plan display | active, trial, canceled |
| `InvoiceRow` | Single invoice in table | default, hover |
| `StudioFrame` | Embedded Sanity Studio wrapper | loading, ready |
| `EmptyState` | No-data placeholder with CTA | default |
| `PriorityBadge` | Ticket priority label | low, medium, high, urgent |
| `StatusBadge` | Generic status display | varies per domain |

---

## 6. Technical Decisions

### Why this stack?

| Decision | Rationale |
|---|---|
| **Next.js 15 App Router** | Vercel deploys it natively; RSC for server-rendered data; clean routing |
| **TypeScript** | Required — this is a production app, not a script |
| **Tailwind CSS + shadcn/ui** | Sean's CRM frontend already uses this; consistency across projects |
| **Prisma** | Portal's own DB (tenant registry, portal users, sessions); syncs tenant list from CRM |
| **NextAuth.js v5** | Standard for Next.js; credentials provider integrates with existing CRM users table |
| **Sanity Studio embedded** | No separate Sanity app to maintain; unified deploy |
| **Sanity Presentation tool** | "Visual editor" without building a custom drag-drop builder |
| **Stripe Customer Portal** | Self-service billing without building a billing UI |

### Environment Variables

```bash
# Database
DATABASE_URL=                  # PostgreSQL (shared with CRM or separate portal DB)

# Auth
AUTH_SECRET=                   # NextAuth secret (openssl rand -base64 32)
NEXTAUTH_URL=                  # https://portal.ctwebsiteco.com

# CRM (for ticket creation + tenant lookup)
CRM_API_URL=                   # https://crm-api-1016182607730.us-east1.run.app
CRM_API_KEY=                   # Internal API key for server-to-server auth

# Sanity (per-tenant — resolved dynamically from tenant DB)
# NEXT_PUBLIC_SANITY_PROJECT_ID=   # Resolved per-tenant, not static
# NEXT_PUBLIC_SANITY_DATASET=      # Resolved per-tenant

# Stripe
STRIPE_SECRET_KEY=             # sk_live_...
STRIPE_WEBHOOK_SECRET=         # whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # pk_live_...
```

### Database Schema (Prisma — portal-specific)

```prisma
model Tenant {
  id                String   @id @default(cuid())
  slug              String   @unique  // URL slug: acme-corp
  name              String            // Display name: Acme Corp

  // Sanity
  sanityProjectId   String
  sanityDataset     String   @default("production")
  sanityToken       String?  // Encrypted viewer/editor token

  // Stripe
  stripeCustomerId  String?

  // Branding
  logoUrl           String?
  accentColor       String?  @default("#6366F1")

  // Relations
  users             PortalUser[]
  tickets           Ticket[]  // Local cache of CRM tickets (optional)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model PortalUser {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  passwordHash  String?  // null if CRM-managed (SSO)

  role          Role     @default(EDITOR)

  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([email, tenantId])
}

enum Role {
  OWNER       // Full access
  EDITOR      // Content only
  BILLING     // Billing read-only
  SUPPORT     // Support tickets only
}
```

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/tenant/[slug]` | GET | Tenant config (for client-side initialization) |
| `/api/tickets` | GET/POST | List + create tickets via CRM API |
| `/api/tickets/[id]` | GET/PATCH | Get + update ticket |
| `/api/billing/subscription` | GET | Current subscription from Stripe |
| `/api/billing/invoices` | GET | Invoice list from Stripe |
| `/api/billing/portal-session` | POST | Create Stripe Customer Portal session URL |

### Middleware Logic

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Skip static files and auth routes
  if (isStaticRoute(pathname)) return NextResponse.next()

  // Extract tenant slug from /[tenant]/... path
  const match = pathname.match(/^\/([a-z0-9-]+)\//)
  if (!match) return NextResponse.redirect(new URL('/not-found', req.url))

  const tenantSlug = match[1]
  const tenant = await getTenantBySlug(tenantSlug) // Prisma lookup

  if (!tenant) return NextResponse.redirect(new URL('/not-found', req.url))

  // Attach tenant to request headers for downstream use
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-tenant-id', tenant.id)
  requestHeaders.set('x-tenant-slug', tenantSlug)

  // Protect portal routes — require auth
  const session = await getToken({ req, secret: AUTH_SECRET })
  if (!session) {
    const loginUrl = new URL(`/${tenantSlug}/login`, req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}
```

---

## 7. Phased Delivery Plan

### Phase 1: Foundation (Weeks 1–2)
- [ ] Project scaffolding: Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [ ] Prisma schema + DB migration
- [ ] NextAuth.js credentials provider wired to CRM API
- [ ] Middleware: tenant resolution + auth guard
- [ ] Portal shell: sidebar + header + layout
- [ ] Login page with tenant-branded design
- [ ] Dashboard page (static skeleton — no data yet)

**Deliverable:** A working, authenticated portal shell at `/[tenant]/dashboard` that redirects to login if unauthenticated. No Sanity, no tickets, no billing yet.

### Phase 2: Sanity Studio (Weeks 2–3)
- [ ] `next-sanity` + Sanity config setup
- [ ] Embedded Studio at `/[tenant]/studio/[[...tool]]`
- [ ] Tenant-scoped Sanity config (projectId, dataset from DB)
- [ ] Role-gated access (owner + editor roles only)
- [ ] Sanity Presentation tool integration for visual editing

**Deliverable:** Clients can log in and fully manage their Sanity content, including visual page editing via Presentation.

### Phase 3: Support Tickets (Week 3)
- [ ] Ticket list page with filters + search
- [ ] New ticket form (subject, description, priority, attachment)
- [ ] Ticket detail page with comment thread
- [ ] `POST /api/tickets` → CRM API

**Deliverable:** Clients can file and track support tickets. Tickets appear in Sean's existing CRM.

### Phase 4: Billing (Week 3–4)
- [ ] Stripe SDK integration
- [ ] Billing overview page: plan card + invoice table
- [ ] Stripe Customer Portal redirect button
- [ ] Invoice PDF download links

**Deliverable:** Clients can see their plan, invoice history, and self-manage billing via Stripe Portal.

### Phase 5: Content Hub + TV Feed (Week 4+)
- [ ] Content overview page (links to common content types)
- [ ] TV Feed management UI (details TBD — scoped after requirements gathering)
- [ ] "TV Feed" submissions create support tickets

**Deliverable:** Clients have a dedicated content section alongside Studio.

### Phase 6: Polish + Launch (Week 5+)
- [ ] Tenant theme system (logo, accent color from DB)
- [ ] Mobile responsive + bottom nav
- [ ] Error boundaries + loading skeletons throughout
- [ ] Email notifications (ticket confirmation, invoice paid, etc.)
- [ ] Vercel deployment + DNS configuration

---

## 8. Open Questions

1. **TV Feed specifics:** What format is the feed? (XML, JSON, API?) Who consumes it? Is there an existing system or are we building from scratch? This changes whether it's a form with a preview or a full editor.

2. **CRM user sync:** When a new tenant is created in the CRM, should a portal user be auto-provisioned? Or is manual provisioning required?

3. **Tenant onboarding:** When a new client signs up, what steps create their Sanity project, Stripe customer, and portal tenant record? Is this manual or automated?

4. **Sanity schema strategy:** Will all tenants share the same Sanity schema (just different projectIds), or does each tenant get custom schema types? This affects how `sanity.config.ts` is structured.

5. **Existing clients:** Do existing CRM clients already have Sanity projects? How are Sanity credentials currently managed?

6. **SSO vs credentials:** Does Sean's CRM already have OAuth/SSO set up, or are we using email/password for client auth?

7. **Domain strategy:** ✅ RESOLVED — `portal.ctwebsiteco.com` for agency; `admin.{clientdomain}.com` per client subdomain. Each client configures a wildcard CNAME `*.clientsite.com` → Vercel. Confirmed with Sean 2026-03-31.

---

## 9. Starting-Point Templates — Research Notes

### Options Considered

| Template | Multi-Tenant | Billing | Auth | Tech | Price | Verdict |
|---|---|---|---|---|---|---|
| **Vercel Platforms** (`vercel/platforms`) | Subdomain-based (Redis) | None | None | Next.js 15, Tailwind 4, shadcn/ui | Free (OSS) | Good reference, not a starter |
| **Makerkit** (`makerkit.dev`) | ✅ Org-based multi-tenancy | Stripe Customer Portal | NextAuth, credentials + social | Next.js 15, Tailwind 4, shadcn/ui, Prisma, Supabase/Firebase | $349–$499 | **Best fit** — closest match to our needs |
| **ShipFast** (`shipfast.start`) | ❌ | Stripe + Lemon Squeezy | Magic links, Google OAuth | Next.js 14, Tailwind, Supabase/MongoDB | $299–$349 | Good SaaS primitives, no multi-tenancy |
| **SaaS Bolierplate** (unstacked) | Varies | Stripe | NextAuth | Next.js, Prisma, Tailwind | Free (OSS) | Many options, scattered quality |

### Recommendation

**Start from Makerkit** — it has the most overlap with our requirements:
- ✅ Multi-tenancy (organizations/tenants)
- ✅ Stripe Customer Portal (billing)
- ✅ NextAuth with credentials provider
- ✅ shadcn/ui + Tailwind CSS
- ✅ TypeScript strict mode
- ✅ Playwright E2E tests (satisfies TDD requirement)
- ✅ AI Agent rules built in (context files for AI understanding)
- ✅ Supabase or Firebase for auth/database
- ❌ No Sanity integration (we add this)

**What we'd take from Makerkit:** Auth flow, portal shell layout, billing page, Playwright test scaffolding, TypeScript strict config, shadcn/ui component setup.

**What we'd replace:** Supabase auth → CRM credentials provider; Supabase DB → Prisma + CRM API; Add `next-sanity` for Studio; Stripe Portal as-is.

**Alternative:** Build from scratch using `create-next-app` + `shadcn/ui` + manual auth/billing. More work, cleaner fit. Given the scope, starting from Makerkit saves 1–2 weeks of boilerplate setup.

---

## 10. AI Coding — Challenges & Mitigations

*This section documents the known failure modes of AI-assisted development and our countermeasures for this project.*

### Challenge 1: Hallucination & Plausible-Wrong Code

**The problem:** AI generates code that looks correct but has subtle bugs, wrong API shapes, or incorrect assumptions about how libraries work. It looks right; it passes a quick review; it breaks in production.

**How it manifests:**
- Returns a non-existent API method (`stripe.customers.listSessions()` — doesn't exist)
- Misreads a library's TypeScript types, producing runtime errors
- Assumes a schema field exists that doesn't, or vice versa
- Returns the wrong HTTP status code or response shape from an API route

**Countermeasures for this project:**

1. **TypeScript strict mode everywhere.** No `any`. AI must produce typed code or TypeScript will catch it. Makerkit ships with strict TypeScript — keep that.
2. **Read the actual library docs.** Before trusting an AI suggestion about a library's API, read the relevant section of the source library's docs (Stripe, Sanity, NextAuth). This is my job before generating code.
3. **Incremental commits.** Commit per-feature, not per-day. Each commit should be reviewable in 5 minutes.
4. **"Does this compile?" before "does this work?"** TypeScript compilation pass must be green before any manual testing.

### Challenge 2: Context Window Exhaustion

**The problem:** As the codebase grows, the AI loses context about the full system. It makes decisions in one file that contradict conventions in another file it can no longer see. The portal grows to 100+ files; without discipline, quality collapses.

**Countermeasures:**

1. **Feature files are small.** Each file has one job. Keep components under 300 lines. Utilities under 100. If a file is getting large, split it.
2. **SPEC.md before code.** For every feature: write the spec first. The spec becomes the testable contract. Code that doesn't match the spec is wrong, even if it "works."
3. **Cross-file references are explicit.** When a component uses a type from another file, import it explicitly. No implicit global state.
4. **CLAUDE.md / AGENTS.md in project root.** Brief project overview, tech stack, conventions. Helps any AI session orient quickly.

### Challenge 3: Lost Institutional Knowledge

**The problem:** When an AI generates code based on a pattern it saw in training, it may ignore project-specific conventions that diverge from common practice. Over time, the codebase accumulates "AI convention" mixed with "our convention" with no clear distinction.

**Countermeasures:**

1. **Conventions in code, not comments.** Use ESLint rules, Prettier config, and TypeScript compiler options to encode conventions. AI respects enforced rules better than written instructions.
2. **This SPEC.md is the source of truth.** Any architectural decision not in SPEC.md is subject to change by convenience. Decisions in SPEC.md are binding until explicitly revised.

### Challenge 4: Test Coverage Theater

**The problem:** AI writes tests that pass but don't actually test the right thing. Tests become checkboxes rather than safety nets.

**Countermeasures — see Section 11 (TDD Process).**

### Challenge 5: Scope Creep Through Ease of Generation

**The problem:** AI makes it fast and cheap to add features. This makes it tempting to over-engineer — adding layers of abstraction, features, and complexity that wouldn't survive a cost-benefit analysis if they took a full day to implement manually.

**Countermeasures:**

1. **"Is this in the spec?" is the first question.** If the answer is no, the feature goes in the backlog, not the current PR.
2. **Simple before clever.** Prefer a 50-line copy-paste solution over a 200-line abstraction. Abstractions earn their place, they don't get it preemptively.
3. **One feature per commit.** Keeps scope visible and reviews tight.

---

## 11. Test-Driven Development (TDD) Approach

### Stack

- **Vitest** for unit and integration tests (faster than Jest, better ESM support)
- **Cucumber + Playwright** for BDD-style E2E tests (Gherkin `.feature` files, human-readable scenarios)
- **TypeScript types** as the first line of tests — write the expected types before the implementation

### TDD Flow for Each Feature

```
1. Write the failing test (red)
   → Test file: __tests__/domain/feature-name.test.ts
   → Unit test for the pure logic / API route handler

2. Write the minimal implementation to pass (green)
   → No optimization, no extra features — just make the test pass

3. Refactor (if needed) — both test and implementation
   → Extract duplication, clean naming, add types

4. Playwright E2E for the user-facing behavior
   → "User can create a ticket" → browser → ticket appears in list
   → "Unauthenticated user is redirected to login"

5. Commit (small, descriptive message referencing the SPEC.md section)
```

### Test File Organization

```
client-portal/
├── __tests__/
│   ├── unit/           # Pure logic, API handlers
│   │   ├── lib/
│   │   │   ├── tenant.test.ts
│   │   │   └── crm-api.test.ts
│   │   └── app/
│   │       └── api/
│   │           └── tickets.test.ts
│   ├── integration/    # API routes + DB (Prisma with SQLite for tests)
│   └── e2e/            # Cucumber + Playwright BDD flows
│       ├── steps/
│       │   ├── login.steps.ts
│       │   ├── tickets.steps.ts
│       │   ├── billing.steps.ts
│       │   └── navigation.steps.ts
│       └── features/
│           ├── login.feature
│           ├── tickets.feature
│           ├── billing.feature
│           └── navigation.feature
```

### What to Test (and What Not To)

**Test (unit/integration):**
- API route handlers: request → response shape, status codes, error handling
- Auth guard logic: valid session → allowed, expired → redirected
- Tenant resolution: slug → tenant record, not found → 404
- Form validation logic: invalid input → error message
- CRM API client: request formatting, response parsing, error mapping

**Test (E2E with Cucumber + Playwright):**
- Full user flows described in Gherkin: `Scenario: Client creates a support ticket`
- Auth flows: redirect to login, redirect back after auth
- Studio loads: `/[tenant]/studio` renders without crash
- Billing page: plan card renders with correct data
- Example `.feature` file:

```gherkin
Feature: Client Support Tickets

  Scenario: Authenticated client creates a support ticket
    Given I am logged in as a client of "acme-corp"
    And I am on the "/acme-corp/support" page
    When I click "New Ticket"
    And I fill in "Subject" with "Login page is broken"
    And I fill in "Description" with "I cannot access my account"
    And I select "High" from "Priority"
    And I click "Submit"
    Then I should see "Login page is broken" in the ticket list
    And the ticket status should be "Open"
```

**Don't test (trust the library):**
- Next.js routing (framework is tested by Vercel)
- shadcn/ui components (tested by the library)
- Third-party SDKs (Stripe SDK, Sanity SDK — tested by their maintainers)
- TypeScript types (if it compiles, the types are correct)

### Pre-commit Hook

Every commit triggers:
1. `vitest --run` — all unit + integration tests
2. `tsc --noEmit` — TypeScript compile check
3. `eslint .` — lint check

Cucumber E2E runs in CI (`cucumber-js` against the dev server), not pre-commit (too slow for local dev loop). Developers run specific `.feature` files manually or via a `test:e2e` npm script during development.

**CI pipeline:**
```
pull request → vitest → tsc → eslint → cucumber-js (all .feature files against deployed preview)
```

---

## 12. Onboarding Workflow (Per SPEC Notes)

When Sean builds a new client website:
1. Sean creates the site in the CRM (new `site` record)
2. CRM creates/links: Sanity project, Stripe customer (or manually)
3. Portal tenant record created: `{ slug, name, sanityProjectId, stripeCustomerId }`
4. Sean invites the client: sends email with portal link `admin.clientsite.com/dashboard` — client already has their own branded subdomain
5. Client sets password (Magic link or credentials, TBD after CRM user sync question answered)
6. Client lands on `/[tenant]/dashboard` — pre-configured with their site

This is the happy path. The implementation details depend on the onboarding automation question in Section 8.

---

*Spec version: 1.1 — Updated 2026-03-31: Added template research, AI coding challenges/methodology, TDD approach, onboarding workflow*
