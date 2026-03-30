# CRM Engineer Role — 2026-03-29

## My Mission
Sean has empowered me to work as a software engineer on the CT Media CRM system. I should:
1. Continuously observe, find bugs, and improve the system
2. Track issues in GitHub Issues (SeanConway102/crm-frontend)
3. Go straight to production (no approval needed for this system)
4. Continuously learn software engineering and design theory

## Operating Rhythm
- **Every :30 past the hour**: cron job runs `crm-cron.sh` — health check, code scan, GitHub issue filing
- **Every heartbeat** (~30min): brief status check  
- **Continuous**: read code, find bugs, file issues, make small fixes, commit/push

## System Architecture
- **Frontend**: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui, Vercel AI SDK
  - Repo: `git@github.com:SeanConway102/crm-frontend.git` (master branch)
  - URL: https://v0-crm-frontend-build-peach.vercel.app
  - Tenant: `ctwebsiteco` · Email: `sully@ctwebsiteco.com` · Password: `Sully2026!`
- **Backend**: Go API on Google Cloud Run
  - URL: https://crm-api-1016182607730.us-east1.run.app
  - API Key auth (X-API-Key header)

## Critical Patterns
- Go backend uses `*T + omitempty` — optional fields are OMITTED from JSON (not null). All TS interfaces must use `?` optional markers
- State: No SWR/React Query — each list page uses `useState` + fetch. Cache invalidation via `crm-mutate` CustomEvent
- `apiFetch` in lib/api.ts unwraps `json.data` for non-paginated responses
- Use `getLogger("module")` from `lib/telemetry` for server-side logging — never console.log
- **NEVER commit console.error** — use getLogger instead

## GitHub Issues
- Repo: `SeanConway102/crm-frontend`
- Cron scans and files issues automatically at :30 past hour
- Currently open: #10, #26 (and #25 is fixed)

## Known Issues Found (2026-03-29)
- [FIXED] #25: "App updated" toast on every page load (RegisterSW component)
- [OPEN] #26: TODO/FIXME/HACK comments audit needed
- [OPEN] #10: Re-add findKBPath tool once backend supports POST /kb/path

## Design & Engineering Research Topics
- Next.js 16 performance patterns
- shadcn/ui v4 patterns  
- TypeScript strict mode best practices
- UX polish patterns for SaaS dashboards

## Pagination Bug Pattern (found 2026-03-29)
**Affected pages** (setData replaces instead of appends on Load More):
- customers/page.tsx
- tickets/page.tsx  
- payments/page.tsx
- companies/page.tsx
- subscriptions/page.tsx
- wiki/page.tsx
- products/page.tsx
- knowledge-base/page.tsx
- invoices/page.tsx

**Fix pattern:**
```tsx
// BROKEN (replaces):
setData(res.data || [])

// FIXED (appends on page > 1):
setData(prev => page === 1 ? (res.data || []) : [...(prev || []), ...(res.data || [])])
```

**Also add toast error** on catch instead of empty `catch {}`
