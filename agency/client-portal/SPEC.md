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

### 3.2.1 Per-Tenant Feature Flags

Every feature in the portal is gated by a feature flag. Tenants don't all get the same features — some have Studio, some have TV Feed, some have billing, etc. Flags are managed by Sean from the agency admin page.

**Flag registry (defined in code — not user-editable):**

| Flag Key | Label | Description | Default |
|---|---|---|---|
| `studio` | Site Editor | Sanity Studio embedded content editor | `false` |
| `support` | Support Tickets | File and track support tickets | `false` |
| `billing` | Billing | Subscription status, invoices, payment form | `false` |
| `content_hub` | Content Hub | Overview of content types with Studio links | `false` |
| `tv_feed` | TV Feed | Satellite TV feed management | `false` |
| `media_library` | Media Library | Sanity media browser | `false` |

**Database schema:**

```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique  // "studio", "support", etc.
  label       String            // "Site Editor", "Support Tickets"
  description String?
  isBeta      Boolean @default(false)

  tenants     TenantFeatureFlag[]

  createdAt   DateTime @default(now())
}

model TenantFeatureFlag {
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  featureFlagId String
  featureFlag FeatureFlag @relation(fields: [featureFlagId], references: [id])
  enabled     Boolean @default(false)

  @@id([tenantId, featureFlagId])
}
```

**Enforcement in the portal:**

```typescript
// lib/features.ts
export async function isFeatureEnabled(
  tenantId: string,
  feature: string
): Promise<boolean> {
  const flag = await prisma.tenantFeatureFlag.findUnique({
    where: { tenantId_featureFlagId: { tenantId, featureFlagId: feature } },
  })
  return flag?.enabled ?? false
}

// Middleware — block access to feature routes
if (pathname.startsWith("/studio") && !(await isFeatureEnabled(tenantId, "studio"))) {
  return NextResponse.redirect(new URL(`/${tenantSlug}/dashboard`, request.url))
}

// Page component — hide nav items
{await isFeatureEnabled(tenantId, "support") && <NavItem href="/support" ... />}
```

**Admin UI (agency `/admin`):**

Each client tenant detail page (`/admin/clients/[tenantId]`) has a "Features" section:
- Toggle switches for each flag
- Visual indicator of which features are active
- "Coming Soon" badge on beta features not yet enabled

**Adding a new flag (developer process):**
1. Add entry to `FEATURE_FLAGS` constant in `lib/features.ts`
2. Add to the database: `prisma.featureFlag.create({ key, label, description })`
3. Flag is now available in the admin UI
4. Enforce in middleware/page components using `isFeatureEnabled()`

---



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

### 4.5 Billing (`/billing`)

**CRM is the source of truth for subscriptions and invoices.** The portal displays what the CRM provides and collects payment when required — it does not manage plans, subscriptions, or invoice generation.

**Overview page:**
- Current plan card: plan name, price, renewal date, status badge (Active / Trial / Past Due / Canceled)
- Subscription status drives the experience:
  - `active` or `trialing` → normal access, green badge
  - `past_due` → orange "Payment required" banner, Stripe Elements payment form embedded inline
  - `canceled` → red banner, read-only access, contact support CTA
- "Manage Billing" → links to Stripe Customer Portal URL stored in tenant record (configured by agency in CRM)
- Last 3 invoices table: date, amount, status (Paid/Open/Void), PDF download link (from CRM API)

**Payment form (shown when `past_due` or initial payment required):**
- Stripe Elements embedded directly on `/billing` — same page, no redirect
- Contextual message: "Update your card to restore access" (decline) or "Complete your setup" (incomplete)
- On success → webhook fires → CRM updates subscription → portal UI unlocks immediately

**Invoices page (`/billing/invoices`):**
- Full invoice history (fetched from CRM API)
- Each row: invoice #, date, amount, status (Paid/Open/Void), PDF download link
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

### Phase 0: Feature Flags (Foundation prerequisite)
- [ ] Add `FeatureFlag` + `TenantFeatureFlag` to Prisma schema
- [ ] Seed `FEATURE_FLAGS` registry into DB
- [ ] `lib/features.ts` — `isFeatureEnabled(tenantId, flag)` + `getEnabledFeatures(tenantId)`
- [ ] Middleware: enforce flags per route (block if flag disabled)
- [ ] Page components: hide features if flag disabled
- [ ] Admin UI: toggle switches per tenant on `/admin/clients/[id]`

### Phase 2: Sanity Studio ✅
- [x] `next-sanity` + Sanity config factory
- [x] Embedded Studio at `/studio` (force-dynamic, role-guarded)
- [x] Fetches Sanity credentials from CRM per-tenant
- [x] `structureTool` with desk structure + `visionTool`
- [x] Per-tenant metadata title

### Phase 3: Support Tickets ✅
- [x] Ticket list page with filters + search
- [x] New ticket form (subject, description, priority)
- [x] `POST /api/tickets` → CRM API

### Phase 4: Billing + Payments ✅
- [x] Stripe webhook handler (verifies sigs, forwards to CRM)
- [x] Billing overview page: plan card + invoice table
- [x] Stripe Customer Portal session redirect
- [x] SetupIntent API for `past_due` card update
- [x] Stripe Elements payment form (inline on `/billing`)
- [x] 38 tests passing

### Phase 5: Content Hub + TV Feed ⬜
- [ ] Content overview page with links to Studio content types
- [ ] "Coming Soon" TV Feed card (placeholder)
- [ ] TV Feed management UI (Phase 6 scope — spec TBD)

### Phase 6: Polish + Launch ⬜
- [ ] **Phase 0: Feature flags** (see §3.2.1) — prerequisite before launch
- [ ] Agency admin UI: client tenant management + feature flag toggles
- [ ] Tenant theme system (logo, accent color from DB)
- [ ] Mobile responsive + bottom nav
- [ ] Error boundaries + loading skeletons throughout
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

## 9. Technology Deep-Dive Notes

### 9.1 NextAuth v5 (Auth.js) — Magic Link + Password Setup

NextAuth v5 Email provider (magic links) with optional password setup. Users receive a link via email, click it, and are logged in. Users who prefer a password can set one up on first login.

```typescript
// app/api/auth/[...nextauth]/route.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Email({
      server: {
        transport: "smtp",
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
      from: process.env.EMAIL_FROM,  // e.g. "Portal <no-reply@ctwebsiteco.com>"
      maxAge: 60 * 60,  // Magic link valid for 1 hour
    }),
    // Password provider added after first login — see "Password setup flow" below
  ],
  callbacks: {
    // Embed tenantId and role into JWT immediately after verification
    async jwt({ token, user }) {
      if (user) {
        // On first magic link sign-in, look up the user's tenant + role from CRM
        const crmUser = await crmApi.getUserByEmail(user.email!)
        token.tenantId = crmUser.tenantId
        token.role = crmUser.role
        token.hasPassword = crmUser.hasPassword ?? false
      }
      return token
    },
    session({ session, token }) {
      session.user.tenantId = token.tenantId as string
      session.user.role = token.role as string
      session.user.hasPassword = token.hasPassword as boolean
      return session
    },
  },
  pages: {
    signIn: "/login",          // Custom login page (magic link request form)
    error: "/login",
    verifyRequest: "/login/verify",  // "Check your email" page after sending magic link
    newUser: "/onboarding",   // First-time users: set password + profile
  },
})
```

**Magic link flow:**
1. Client visits `/login` → enters email → clicks "Sign in"
2. Server looks up email in CRM → confirms tenant exists → sends magic link via Resend/SMTP
3. Client clicks link in inbox → redirected to `/api/auth/callback/email?token=...` → NextAuth verifies → JWT issued
4. If `user.hasPassword === false` → redirect to `/onboarding` → set password → then go to dashboard

**Password setup flow (first login):**
- Magic link brings new users to `/onboarding` instead of dashboard
- `/onboarding` page: "Set up your password to access your portal" — password field + confirm
- On submit: password hashed with bcrypt, stored in CRM (or portal DB), `hasPassword = true`
- Next login: client can use password OR request a new magic link

**JWT strategy:** Token stored in HttpOnly cookie. No DB session table. `tenantId` + `role` + `hasPassword` embedded in JWT — middleware reads without a DB call.

**Protecting routes:** `auth()` in Server Components, `getServerSession()` in API routes, `useSession()` in client components.

### 9.2 Stripe Billing — Simplified (CRM Owns Subscriptions)

Stripe subscriptions have a `status` that drives what the UI shows:

| Stripe Status | Meaning | Client Access |
|---|---|---|
| `trialing` | Free or paid trial period active | Full access |
| `active` | Payment received, subscription current | Full access |
| `incomplete` | Subscription created, awaiting first payment | Limited access — payment required |
| `incomplete_expired` | First invoice never paid within 23h window | No portal access |
| `past_due` | Payment failed (card declined) | Limited access — update payment required |
| `canceled` | Subscription ended (voluntary or failed) | No portal access |
| `unpaid` | All attempts failed, subscription past grace period | No portal access |

**The `incomplete` flow for new signups:**
1. Sean creates tenant in portal DB → triggers subscription creation in Stripe via API
2. Stripe subscription created with `payment_behavior: 'default_incomplete'` → status becomes `incomplete`
3. Stripe creates an `open` invoice (23-hour window)
4. Client logs in → Stripe subscription status read from webhook cache → sees `incomplete` → redirected to payment screen
5. Client enters card via Stripe Checkout (or Stripe Elements embedded) → Stripe charges → webhook fires `invoice.paid` → subscription becomes `active` → client gets full portal access

**Smart Retries for `past_due`:**
Stripe automatically retries failed payments on a schedule (configurable: 1 day, 3 days, 5 days, 7 days). Smart Retries uses data to pick optimal retry timing. This recovers ~40% of failing payments automatically without any code.

**Webhook events to handle:**
```
invoice.created          → log, no action
invoice.paid             → subscription.status = 'active', unlock access ✅
invoice.payment_failed   → subscription.status = 'past_due', trigger dunning email
customer.subscription.updated → sync status to portal DB
customer.subscription.deleted → subscription.status = 'canceled', revoke access
```

### 9.3 next-sanity — Embedded Studio + CT Website Co. Branding

`next-sanity` v7+ is the official toolkit for embedding Sanity Studio in Next.js. The critical requirement: the embedded Studio must be 100% branded to CT Website Co., not Sanity.

**What "100% branded" means:**
- No Sanity logo, name, or visual identity anywhere in the Studio
- Custom logo, favicon, and theme matching CT Website Co.'s design
- Title: "Content Editor" (or configurable per tenant) — not "Sanity Studio"
- Custom theme colors matching the portal's brand

**Per-tenant config factory:**
```typescript
// lib/sanity-config-factory.ts
export function createSanityConfig(tenant: Tenant) {
  return defineConfig({
    basePath: "/studio",
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    // Custom CT Website Co. branding — no Sanity identity
    title: `${tenant.name} Content Editor`,
    logo: "/ct-website-logo.svg",  // CT Website Co. logo, not Sanity's
    favicon: "/ct-website-favicon.ico",
    theme: createCtWebsiteTheme({ accentColor: tenant.accentColor }),
    // Hide all Sanity branding
    studioUrl: "/studio",  // Prevents Sanity branding in URLs
    plugins: [
      structureTool({ structure: buildTenantStructure(tenant) }),
      presentationTool({ ... }),  // Visual Editing
    ],
    schema: { types: tenant.schemaTypes },  // Custom per-client schema
  })
}
```

**Custom theme:**
```typescript
// lib/sanity-theme.ts
import { createTheme } from "@sanity/ui"
import { defineTheme } from "@sanity/ui/theme"

export function createCtWebsiteTheme({ accentColor = "#6366F1" } = {}) {
  return createTheme({
    ...defineTheme({}),
    // Override colors to match CT Website Co. brand
    color: {
      ...defineTheme({}).color,
      primary: { 500: accentColor },
    },
    // Typography: match the portal's Inter font
    font: {
      ...defineTheme({}).font,
      family: "Inter, system-ui, sans-serif",
    },
  })
}
```

**Custom logo component:**
```tsx
// components/sanity/ct-logo.tsx
export function CtWebsiteLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {/* CT Website Co. SVG logo */}
        <rect width="28" height="28" rx="6" fill="#6366F1" />
        <text x="14" y="19" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">CT</text>
      </svg>
      <span className="text-sm font-semibold text-foreground">Content Editor</span>
    </div>
  )
}
```

**Custom login screen:**
Sanity Studio's default login screen shows Sanity branding. When embedded, we replace it with a CT Website Co.-branded screen. This requires overriding the Studio's `LoginScreen` component via a custom `StudioLayout`.

**Hiding Sanity branding throughout:**
- `document.options.hideCopyToClipboard = true`
- No "Powered by Sanity" anywhere
- Custom CSS overrides to remove Sanity footer
- Custom `<title>` tag: "Acme Corp — Content Editor" not "Sanity Studio"

**Per-client Sanity schemas:**
Each client's website has different content types. The portal handles this by storing each client's schema definition in the tenant DB record:
```typescript
// Tenant record in portal DB
{
  id: "tenant_123",
  slug: "acme-corp",
  sanityProjectId: "abc123",
  sanityDataset: "production",
  schemaTypes: ["page", "blogPost", "author", "service", "testimonial", ...],  // custom per-client
}
```
On the server, we resolve the schema types from the tenant record and pass them to the Sanity config factory. Schemas are registered at build/compile time — in practice, this means the portal app imports all possible schema types and the tenant config selects which subset to activate per client. This gives full schema flexibility without runtime schema loading.

**Visual Editing (Presentation tool) — same branding:**
The Presentation tool renders the client's live site inside an iframe. The toolbar and chrome around that iframe use CT Website Co. branding. The live site content itself is the client's, but the editing environment is fully branded.

**CRM as source of truth for Sanity credentials:**
The CRM already stores `sanity_project_id`, `sanity_preview_url`, `sanity_preview_secret`, and `sanity_path_template` per site. The portal tenant record references a CRM site ID, and the Sanity config factory fetches credentials from the CRM API at request time (server-side only, never exposed to the client):

```typescript
// lib/sanity-config-factory.ts
export async function createSanityConfig(tenant: Tenant) {
  // Fetch Sanity credentials from CRM API (server-side only)
  const site = await crmApi.getSite(tenant.crmSiteId)
  return defineConfig({
    projectId: site.sanityProjectId,
    dataset: site.sanityDataset || "production",
    token: site.sanityToken,  // Editor token from CRM
    ...
  })
}
```

This means no duplicate credential storage — the portal reads from the CRM's existing integration record.

`next-sanity` v7+ is the official toolkit for embedding Sanity Studio in Next.js. The critical requirement: the embedded Studio must be 100% branded to CT Website Co., not Sanity.

**What "100% branded" means:**
- No Sanity logo, name, or visual identity anywhere in the Studio
- Custom logo, favicon, and theme matching CT Website Co.'s design
- Title: "Content Editor" (or configurable per tenant) — not "Sanity Studio"
- Custom theme colors matching the portal's brand

**Per-tenant config factory:**
```typescript
// lib/sanity-config-factory.ts
export function createSanityConfig(tenant: Tenant) {
  return defineConfig({
    basePath: "/studio",
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    // Custom CT Website Co. branding — no Sanity identity
    title: `${tenant.name} Content Editor`,
    logo: "/ct-website-logo.svg",  // CT Website Co. logo, not Sanity's
    favicon: "/ct-website-favicon.ico",
    theme: createCtWebsiteTheme({ accentColor: tenant.accentColor }),
    // Hide all Sanity branding
    studioUrl: "/studio",  // Prevents Sanity branding in URLs
    plugins: [
      structureTool({ structure: buildTenantStructure(tenant) }),
      presentationTool({ ... }),  // Visual Editing
    ],
    schema: { types: tenant.schemaTypes },  // Custom per-client schema
  })
}
```

**Custom theme:**
```typescript
// lib/sanity-theme.ts
import { createTheme } from "@sanity/ui"
import { defineTheme } from "@sanity/ui/theme"

export function createCtWebsiteTheme({ accentColor = "#6366F1" } = {}) {
  return createTheme({
    ...defineTheme({}),
    // Override colors to match CT Website Co. brand
    color: {
      ...defineTheme({}).color,
      primary: { 500: accentColor },
    },
    // Typography: match the portal's Inter font
    font: {
      ...defineTheme({}).font,
      family: "Inter, system-ui, sans-serif",
    },
  })
}
```

**Custom logo component:**
```tsx
// components/sanity/ct-logo.tsx
export function CtWebsiteLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {/* CT Website Co. SVG logo */}
        <rect width="28" height="28" rx="6" fill="#6366F1" />
        <text x="14" y="19" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">CT</text>
      </svg>
      <span className="text-sm font-semibold text-foreground">Content Editor</span>
    </div>
  )
}
```

**Custom login screen:**
Sanity Studio's default login screen shows Sanity branding. When embedded, we replace it with a CT Website Co.-branded screen. This requires overriding the Studio's `LoginScreen` component via a custom `StudioLayout`.

**Hiding Sanity branding throughout:**
- `document.options.hideCopyToClipboard = true`
- No "Powered by Sanity" anywhere
- Custom CSS overrides to remove Sanity footer
- Custom `<title>` tag: "Acme Corp — Content Editor" not "Sanity Studio"

**Per-client Sanity schemas:**
Each client's website has different content types. The portal handles this by storing each client's schema definition in the tenant DB record:
```typescript
// Tenant record in portal DB
{
  id: "tenant_123",
  slug: "acme-corp",
  sanityProjectId: "abc123",
  sanityDataset: "production",
  schemaTypes: ["page", "blogPost", "author", "service", "testimonial", ...],  // custom per-client
}
```
On the server, we resolve the schema types from the tenant record and pass them to the Sanity config factory. Schemas are registered at build/compile time — in practice, this means the portal app imports all possible schema types and the tenant config selects which subset to activate per client. This gives full schema flexibility without runtime schema loading.

**Visual Editing (Presentation tool) — same branding:**
The Presentation tool renders the client's live site inside an iframe. The toolbar and chrome around that iframe use CT Website Co. branding. The live site content itself is the client's, but the editing environment is fully branded.

`next-sanity` v7+ is the official toolkit for embedding Sanity Studio in Next.js. Two key components:

**`<NextStudio />`** — The full embedded Studio:
```tsx
// app/(portal)/studio/[[...tool]]/page.tsx
import { NextStudio } from "next-sanity/studio"
import config from "@/sanity.config"  // per-tenant config

export const dynamic = "force-static"
export { metadata, viewport } from "next-sanity/studio"

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

**Sanity config driven by tenant context:**
The `sanity.config.ts` is a factory function, not a static export. On the server, we read the tenant's Sanity credentials and generate the config:
```typescript
// lib/sanity-config-factory.ts
export function createSanityConfig(tenant: Tenant) {
  return defineConfig({
    basePath: "/studio",  // path within tenant subdomain
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    plugins: [
      structureTool({ structure: tenantStructure(tenant) }),
      presentationTool({...}),  // Visual Editing
    ],
    schema: { types: tenant.schemaTypes },
    token: tenant.sanityToken,  // editor token for read/write
  })
}
```

**Visual Editing (Presentation tool):**
Sanity's Presentation tool lets editors click on their actual website to edit content. Requires:
1. `presentationTool()` added to `sanity.config.ts` plugins
2. A "presentation" route in Next.js where the live preview renders: `/studio/[[...tool]]/presentation/[pageId]`
3. Content Source Maps enabled on the frontend (Sanity adds metadata to GROQ responses so it knows what Sanity document each DOM element corresponds to)
4. `<VisualEditing />` component in the frontend's root layout (outside of `/studio` routes so it doesn't render inside the Studio itself)

This is what makes the "visual page editor" work without us building a custom drag-drop builder.

### 9.4 Billing Model — CRM as Source of Truth

**Key simplification:** The CRM owns subscriptions and invoices. The portal only needs to:
1. Display subscription status and invoice history
2. Collect payment when the CRM says payment is required
3. Know when to block access based on payment status

This means no Stripe plan management, no pricing configuration, no subscription creation in the portal. The portal is a billing *display* + *payment collector*, not a billing engine.

**Data flow:**
```
CRM (source of truth)               Stripe (payment processor)
     │                                      │
     ▼                                      ▼
Creates subscription             Stripe processes charges
Creates invoice                  Fires webhooks
     │                                      │
     └────────────────┬──────────────────────┘
                     ▼
              CRM webhook handler
              (updates subscription status in CRM)
                     │
                     ▼
              Portal DB cache
              (subscription status synced via CRM API or webhook)
                     │
                     ▼
              Portal UI reads:
              - subscription.status → show active OR payment-required
              - invoices[] → billing page table
```

**Subscription statuses the portal handles:**
| CRM Status | Stripe Status | Portal Behavior |
|---|---|---|
| `active` | `active` | Full access |
| `trialing` | `trialing` | Full access, show trial end date |
| `past_due` | `past_due` | Orange banner, payment form on `/billing` |
| `canceled` | `canceled` | Red banner, read-only, contact support |
| `incomplete` | `incomplete` | Payment form on `/billing` — first payment |

**Portal's Stripe webhook handler** (forwards to CRM, updates local cache):
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)

  // Forward raw event to CRM for processing (CRM is source of truth)
  await crmApi.forwardStripeEvent(event)

  // Update local cache for fast UI rendering
  switch (event.type) {
    case "invoice.paid":
      await prisma.subscription.update({ where: { stripeId: event.data.object.subscription }, data: { status: "active" } })
      break
    case "invoice.payment_failed":
      await prisma.subscription.update({ where: { stripeId: event.data.object.subscription }, data: { status: "past_due" } })
      break
    case "customer.subscription.deleted":
      await prisma.subscription.update({ where: { stripeId: event.data.object.id }, data: { status: "canceled" } })
      break
  }

  return NextResponse.json({ received: true })
}
```

**What the portal does NOT own:**
- Stripe plan/product configuration (CRM + Stripe Dashboard)
- Subscription creation (CRM)
- Invoice generation (CRM)
- Subscription cancellation (CRM + Stripe Customer Portal)
- Trial periods and pricing (CRM)

**What the portal does own:**
- Subscription status display
- Invoice history (fetched from CRM API)
- Stripe Elements payment form (triggered when CRM says `past_due` or `incomplete`)
- "Manage Billing" link → Stripe Customer Portal URL (stored in tenant record, configured by agency in CRM)

Portal DB schema for tenant registry and user management:

```typescript
// prisma/schema.prisma

model Tenant {
  id          String   @id @default(cuid())
  slug        String   @unique  // "acme-corp" — used in fallback URL
  name        String            // "Acme Corporation" — display name
  type        TenantType @default(CLIENT)

  // Primary domain — their website
  domain      String   @unique  // "acme-corp.com"

  // Admin subdomain (optional — set when DNS is configured)
  subdomain   String?  @unique  // "admin.acme-corp.com"

  // Branding
  logoUrl     String?
  accentColor String   @default("#6366F1")

  // Integrations
  sanityProjectId  String?
  sanityDataset     String   @default("production")
  sanityToken      String?  // Encrypted at rest

  stripeCustomerId  String?

  // Relations
  users     PortalUser[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PortalUser {
  id       String @id @default(cuid())
  email    String
  name     String?
  password String?  // Hashed with bcrypt. Null if CRM-managed SSO

  role     UserRole @default(EDITOR)

  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  @@unique([email, tenantId])
}

enum TenantType {
  AGENCY   // portal.ctwebsiteco.com — agency's own tenant
  CLIENT   // admin.clientsite.com — per-client tenant
}

enum UserRole {
  OWNER        // Full access
  EDITOR       // Content/studio only
  BILLING      // Billing read-only
  SUPPORT      // Support tickets only
}
```

**Indexing:** `Tenant.domain`, `Tenant.subdomain`, `PortalUser.email` — all unique indexes. Tenant lookup in middleware is a single indexed DB query.

### 9.5 Middleware — Subdomain Resolution + Auth Guard

```typescript
// middleware.ts
import { auth } from "@/auth"

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || ""

  // Resolve tenant from subdomain or path fallback
  const tenant = await resolveTenant(hostname)  // see §3.1
  if (!tenant) return NextResponse.next()       // Not a portal request

  // Attach tenant context for downstream
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-tenant-id", tenant.id)

  // Auth check — all portal routes require authentication
  const session = await auth(req)
  if (!session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("tenant", tenant.slug)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access: agency routes require agency role
  if (req.nextUrl.pathname.startsWith("/admin") && session.user.role !== "OWNER") {
    return NextResponse.redirect(new URL(`/${tenant.slug}/dashboard`, req.url))
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

---

## 10. UX Design Theory — B2B SaaS Client Portal

### 10.1 Design Principles

**B2B SaaS is different from consumer UX.** Clients are at work, often on a deadline, and they're using this portal reluctantly — it's not their primary business. The design must minimize cognitive load, not impress with creativity.

**Three rules that govern every design decision:**

1. **Orientation on every page.** Clients don't navigate B2B SaaS apps the way they'd browse consumer apps. They arrive via a link from an email, do one specific thing, and leave. Every page must answer "Where am I? What can I do here? How do I get back to what I need?" immediately — within 3 seconds.

2. **Progressive disclosure, not overwhelming detail.** Show the most common action. Hide the rest. Expand sections only when the user asks. Don't surface 47 configuration options on first load.

3. **Respect the 5-minute rule.** A new client invited to the portal should be able to complete their first meaningful task (file a ticket, find their invoice) in under 5 minutes, without asking for help. If they can't, the UX has failed — not the client.

### 10.2 Navigation Architecture

**Sidebar (desktop):**
- Always visible, 240px wide, collapsible to 64px icon-only mode
- Top: tenant logo + name (links to dashboard)
- Middle: primary nav — Dashboard, Studio, Content, Support, Billing
- Bottom: Settings, Help, Sign Out
- Agency users: extra "All Clients" admin link at top

**Active state:** Left border accent in brand color, icon + label, subtle background tint. Clients must always know which section they're in.

**Breadcrumb:** Below header on every page. Shows: Home > Section > Page. Essential for deep pages (e.g., Support > Ticket #234 > Reply).

**Mobile:** Bottom tab bar with 5 items. Icons only, no labels (too cramped). Long-press or tap opens sub-nav sheet.

### 10.3 Color & Branding — White-Label Strategy

Each client can set a custom `accentColor` (stored in tenant DB). The portal UI uses that accent throughout — buttons, links, active states, badges. This is the single most impactful white-label customization.

**What the agency controls, not the client:**
- Core layout and component design (not customizable)
- UX patterns and flows (consistent, not customizable)
- Typography (Inter, not customizable)

**What clients can customize:**
- Accent color (hex picker — stored in tenant record)
- Logo (URL — displayed in sidebar and login page)

**What stays fixed:** The portal feels like a CT Website Co. product. The goal is trust and reliability — not invisibility. Clients know they're in a professional tool, not their own DIY app.

### 10.4 Empty States — First-Time Experience

Every section handles the "nothing here yet" state deliberately. These aren't placeholder screens — they're the most important onboarding moments.

**Examples:**
- Ticket list (no tickets yet): "No support tickets yet. If something needs attention, create a ticket and we'll get right on it." + prominent "Create Ticket" button.
- Studio (no content set up): Sanity handles this with its own onboarding, but we show a "Setting up your site? Contact your project manager" note.
- Billing (no subscription yet): "Your subscription is being set up. You'll have full access once your plan is active." — no anxiety about missing billing info.

### 10.5 Loading & Error States

**Loading:** Skeleton shimmer matching the content shape. Never a spinner for content. Spinner only for actions being submitted.

**Errors:** Plain English. "We couldn't load your tickets — check your connection and try again" + a Retry button. Error messages never expose technical details.

**Stale data:** If ticket status updates via webhook, show a brief toast: "Ticket #123 status updated to In Progress" without disrupting the user. Don't require a page refresh.

---

## 11. Sign-In & Payment Flow — Full Design

### 11.1 The Problem We're Solving

Two distinct payment scenarios need UX:
1. **New client signs up** → subscription is `incomplete` → they need to pay before full access
2. **Existing client has a card decline** → subscription goes `past_due` → they need to update payment to restore access

Both cases need a payment screen that: (a) is clear about what's happening, (b) doesn't require re-logging in, (c) gets them to payment quickly, (d) restores access immediately after payment succeeds.

### 11.2 Auth Flow

```
[1] User visits portal
    │
    ▼
[2] Middleware resolves tenant from subdomain
    │
    ▼
[3] Check session cookie → Has valid JWT?
    ├── YES → Read tenant + role from JWT
    │         → Is subscription active?
    │              ├── YES  → /dashboard
    │              └── NO   → /billing (payment form inline)
    │
    └── NO  → /login
              │
              ▼
        [4] Enter email → "Send magic link" button
            → NextAuth sends magic link via Resend
            → /login/verify page: "Check your email"
            │
            [5] User clicks magic link in inbox
                → NextAuth verifies token
                → JWT issued (tenantId + role + hasPassword embedded)
                → First login with no password set?
                     YES → redirect to /onboarding → set password
                     NO  → redirect to /dashboard (or /billing if payment due)
```

### 11.3 Payment Form — Embedded on `/billing`

**The payment form lives on `/billing`, not a separate page.** When the CRM sets `subscription.status === 'past_due'` or `status === 'incomplete'`, the billing page conditionally renders the payment form inline — no redirect, no separate page.

**Why inline on `/billing`:** The client is already on the billing page when they see "Payment required" (or they navigate there from the dashboard banner). They update their card in context, see their plan and invoice history alongside it, and restore access without leaving the page.

**Stripe Elements (embedded):** `@stripe/react-stripe-js` + `@stripe/stripe-js`. Card data goes directly from browser to Stripe — never touches our server (PCI compliant).

```tsx
// components/payment/payment-form.tsx
function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement)! },
    })
    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      onSuccess()  // webhook fires → CRM updates status → portal UI unlocks
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? "Processing..." : "Update Payment Method"}
      </Button>
    </form>
  )
}
```

**How the form gets `clientSecret`:** The billing page calls `GET /api/billing/subscription` → CRM API returns `{ clientSecret, status }`. Portal renders `<PaymentForm clientSecret={clientSecret} />`.

**On success:** Webhook fires `invoice.paid` → CRM updates subscription → next page load (or SWR refresh) shows `status: active` → banner disappears, full portal unlocked.

### 11.5 Card Declined / `past_due` Flow

When Stripe fires `invoice.payment_failed`:
1. Webhook handler → forwards event to CRM → CRM updates subscription status to `past_due`
2. Portal DB cache updated (fast UI re-render without waiting for CRM API poll)
3. Client visits `/billing`:
   - Banner: "Your last payment didn't go through. Update your card to restore access."
   - Plan card shows `Past Due` badge
   - Stripe Elements payment form renders inline (pre-filled if Stripe has saved card on file)
   - "We tried charging your card on [date] — it was declined."

4. On successful payment → `invoice.paid` webhook → CRM → portal cache → `status: active` → banner gone, full access restored

**Smart Retries:** Stripe automatically retries on days 1, 3, 5, 7 (configurable). During the retry window, client still has access. Stripe sends dunning emails automatically. The portal shows a yellow warning banner but doesn't hard-lock.

---

## 12. Client Onboarding — Manual, One-by-One

Onboarding is manual. Sean sets up each client one at a time. No self-service signup flow yet.

**Sean's setup steps (agency portal):**
1. **Create tenant** → `/admin/clients/new` → Enter client name, domain, logo URL, accent color
2. **Create Sanity project** → Manually in Sanity dashboard → Copy project ID + dataset into tenant record
3. **Configure schema types** → Select which content types apply to this client's site
4. **Link Stripe customer** → Paste Stripe Customer ID into tenant record
5. **Send invite** → Enter client's email → Magic link sent → First-login password setup

**Client's first-login flow (after receiving magic link):**
1. Click magic link → redirected to `/onboarding`
2. "Welcome to your client portal" — set password
3. Redirect to `/dashboard` → full portal access

**What's already set up before the client gets their invite:**
- Sanity project with their content schema
- Stripe subscription (created by Sean in CRM)
- Tenant record with logo, accent color, integrations configured

The client never sees a setup wizard — by the time they get the invite link, everything is pre-configured.

---

## 13. Open Questions — Final

1. ~~TV Feed~~ — postponed to Phase 6 (end)
2. ~~Domain strategy~~ — RESOLVED: subdomain per client + agency domain fallback
3. ~~Subscription model / Stripe setup~~ — RESOLVED: CRM owns subscription management. Portal reads status, shows payment form when required.
4. ~~Invite flow~~ — RESOLVED: Magic link email → first login sets password → subsequent logins use magic link OR password.
5. ~~Trial period~~ — RESOLVED: No trials. Pay upfront.
6. ~~Sanity schema strategy~~ — RESOLVED: Custom per-client. All possible schema types imported in the app; tenant config selects which subset to activate per client.
7. ~~CRM user sync~~ — RESOLVED: Portal users are NOT CRM users. Separate user management. Sean provisions each client manually in the agency portal.
8. ~~Onboarding~~ — RESOLVED: Manual, one-by-one. Sean creates tenant in agency portal → sets up Sanity project → sends invite.
9. ~~Existing clients + Sanity~~ — RESOLVED: Some existing CRM clients already have Sanity projects (CRM stores `sanity_project_id` per site). The portal tenant will reference the CRM site ID → portal fetches Sanity credentials from CRM API. Migration is per-client based on whether they already have a Sanity project.

---

*Spec version: 2.0 — Final — 2026-03-31: All decisions locked. Ready for scaffolding.*

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
