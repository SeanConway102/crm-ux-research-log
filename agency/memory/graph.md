# Knowledge Graph

## People
- **Sean Conway** [Lead Engineer, CT Website Co]
  - manages: CRM Backend, all client sites, frontend
  - prefers: concise mobile updates, emoji status, bullet lists
  - timezone: America/New_York
  - tools: Claude Code, v0, GitHub, lefthook

## Projects
- **CRM Backend** [Go, Cloud Run, Production]
  - repo: ctwebsiteco/crm
  - api: https://crm-api-1016182607730.us-east1.run.app
  - depends-on: Neon Postgres, Redis
  - deployed-to: Google Cloud Run (us-east1)
  - architecture: clean architecture, Chi router, tenant isolation, no ORM
  - auth: X-API-Key header

- **CRM Frontend** [Next.js 16, Vercel, Production]
  - url: https://v0-crm-frontend-build-peach.vercel.app
  - stack: Next.js 16, AI SDK v6, shadcn/ui, Tailwind CSS
  - deployed-to: Vercel
  - ci: GitHub Actions (lint + build on push/PR)

- **CRM MCP Server** [Go, Cloud Run]
  - url: https://crm-api-1016182607730.us-east1.run.app/mcp
  - transport: streamable-http
  - tools: 200+ CRM operations

- **Knowledge Base MCP** [Go, Cloud Run]
  - url: https://crm-api-1016182607730.us-east1.run.app/kb-mcp
  - transport: streamable-http

## Clients
- **Pals Power Washing** [Client Site, Optimized]
  - url: palspowerwashing.com
  - repo: ctwebsiteco/v0-pals-power-washing-website
  - hosting: Vercel
  - lighthouse: 95+ (was 67, fixed 2026-03-29)
  - fix: compressed 65 images via sharp, saved 93MB

- **Tax Career Advisor** [Client Site, Optimized]
  - url: taxcareeradvisor.com
  - repo: ctwebsiteco/v0-tax-career-advisor-website
  - hosting: Vercel
  - lighthouse: 95+ (was 75, fixed 2026-03-29)
  - bonus: fixed 4 TS errors, re-enabled typescript validation

- **Fairway Irrigation** [Client Site, Optimized]
  - url: fairwayirrigationandlawn.com
  - repo: ctwebsiteco/v0-fairway-irrigation-website
  - hosting: Vercel
  - lighthouse: 95+ (was 70, fixed 2026-03-29)

- **3Cs Tavern** [Client Site, Optimized]
  - repo: ctwebsiteco/v0-3-c-s-tavern-website-jg
  - hosting: Vercel
  - lighthouse: 95+ (was 71, fixed 2026-03-29)

- **Lizhai Art Studio** [Client Site, Optimized]
  - url: lizhaiartschools.com
  - repo: ctwebsiteco/v0-li-zhai-art-studio
  - hosting: Vercel
  - lighthouse: 95+ (was 77, fixed 2026-03-29)

- **ctpolitics.tv** [Client Site, Optimized]
  - repo: ctwebsiteco/ctpolitics-tv
  - hosting: Vercel
  - lighthouse: 95+ (was 53, fixed 2026-03-29)
  - warning: 35 dependency vulnerabilities (11 high, 22 moderate)

- **McCabes Moving** [Client Site, QA Approved]
  - preview: https://mccabesmoving.preview.ctwebsiteco.com
  - status: ready for production (2026-03-29)

## Decisions
- **2026-03-29: Sharp for all image optimization**
  - applies-to: all v0-* client sites
  - pattern: install sharp, remove unoptimized:true, AVIF+WebP config, quality 75, max 1920px
  - reason: Lighthouse performance scores consistently jump 20-40 points

- **2026-03-29: Active heartbeats, not passive**
  - applies-to: Sully's HEARTBEAT.md
  - reason: Sean wants actual dev work done during heartbeats, not just health monitoring

- **2026-03-29: QA all changes before merge**
  - applies-to: all client site changes
  - method: browser screenshot + page checks on preview URL

## Patterns
- **Image Optimization Fix** [Repeatable]
  - steps: pnpm add sharp, remove unoptimized:true, add formats ["image/avif","image/webp"], minimumCacheTTL 2592000, quality [75], build, verify Lighthouse
  - applied-to: Pals, Tax Career, Fairway, 3Cs, Lizhai, ctpolitics
  - typical improvement: +20-40 Lighthouse points

- **OIDC Token Refresh** [Maintenance]
  - trigger: token expired or <6h remaining
  - steps: cd frontend && vercel env pull .env.local, copy AI_GATEWAY creds to backend/.env
  - note: tokens expire ~24h, discovered 16-day-old expired token on 2026-03-29

## Open Tickets (as of 2026-03-29)
- f2a13e00: Fix Sites Under Sites Section (Urgent)
- 86245bca: Verify Stripe business for SpeakSite (High)
- 8f7b3f97: Implement TV Syndication (Medium, Backlog)
- ac1cfb62: MLS Realty Feed (Medium, Backlog)
- 75d4a7d8: AMY CHAI PICTURES (Medium, Backlog)
- cd61d1c1: septic ben savage pictures (Medium, Backlog)

## Clients (2026-03-31 audit — NEW)
- **DMarie's Pizza** [CRITICAL - Client Site, Unaudited]
  - url: dmariespizza.com
  - perf: 27, access: 35, bp: 50, seo: 92
  - ticket: bd3d7de0-ab17-4aff-a0ac-d72134aac195
  - issues: Extremely poor perf (LCP 40.7s), very poor accessibility (35)

- **Townsend Agency** [CRITICAL - Client Site, Unaudited]
  - url: thetownsendagencyhomecare.com
  - perf: 25, access: 59, bp: 57, seo: 77
  - ticket: 5b7cdcbd-b7fa-4981-bbef-b7c33f49fbab
  - issues: Critical perf (LCP 21.2s), poor access/bp/seo across board

- **Manhattan Southington** [CRITICAL - Client Site, Unaudited]
  - url: manhattansouthington.com
  - perf: 43, access: 94, bp: 96, seo: 92
  - ticket: 8d60044d-e92b-43ca-8696-4d494c530bc4
  - issues: LCP 28.4s — very high

- **Refillpen** [CRITICAL - Client Site, Unaudited]
  - url: refillpen.com
  - perf: 42, access: 95, bp: 73, seo: 100
  - ticket: da8e72d5-fdb9-4bf3-974d-a3f6825e7014
  - issues: LCP 10.3s, Best Practices 73

- **Chai for Congress** [Client Site, Unaudited]
  - url: chaiforcongress.com
  - perf: 51, access: 100, bp: 96, seo: 100
  - ticket: 18e5d5b3-d230-4329-9cf8-d1cc3cf2950e
  - issues: Perf 51, LCP 12.3s

- **Brimatco** [Client Site, Unaudited]
  - url: brimatco.com
  - perf: 56, access: 96, bp: 92, seo: 100
  - ticket: bd3d7de0-ab17-4aff-a0ac-d72134aac195 (shared)
  - issues: Perf 56, BP 92

- **Middlebury Contracting** [Client Site, Unaudited]
  - url: middleburycontracting.com
  - perf: 57, access: 96, bp: 100, seo: 100
  - ticket: 05e0e4e9-3965-4c88-ae70-85f1762cd4ff

- **Southington Gardens** [Client Site, Unaudited]
  - url: southingtongardens.com
  - perf: 59, access: 94, bp: 100, seo: 100
  - ticket: 172831f8-a987-4989-8664-861e96dddf51
  - issues: LCP 24.0s — very high

- **Marlin Roofing** [Client Site, Unaudited]
  - url: marlinroofingsiding.com
  - perf: 61, access: 98, bp: 100, seo: 100
  - ticket: a6e975c8-c45a-4b95-bc75-f7eb069cffb0

- **A & B Entertainment** [Client Site, Unaudited]
  - url: abentertainment.com
  - perf: 60, access: 89, bp: 78, seo: 100
  - ticket: c05930c5-f1a8-43a9-b54d-d3e92b4f9f38
  - issues: Access 89, BP 78

- **Energy Busters** [Client Site, Optimized but regressed]
  - url: energybustersltd.com
  - perf: 62, access: 96, bp: 81, seo: 100
  - ticket: de9a1ca9-a372-4974-88d2-82d5f0032e30
  - note: Was optimized previously (graph says 95+), now 62. Re-audit needed.

## Unfixable Sites (no GitHub repo / external hosting)
- arthurcarrollcrop.com, kandshomesllc.org, DSE Drilling, worldofartcraft.com
- lemscymbalfelts.com, cmccomputers.net, apizzagrandetrailer.com
- paradispools.com, The Scoop Coop

## Open Tickets (as of 2026-03-31 — UPDATED)
- f2a13e00: Fix Sites Under Sites Section (Urgent)
- 86245bca: Verify Stripe business for SpeakSite (High)
- 8f7b3f97: Implement TV Syndication (Medium, Backlog)
- ac1cfb62: MLS Realty Feed (Medium, Backlog) — no repo, needs manual
- 75d4a7d8: AMY CHAI PICTURES (Medium, Backlog)
- cd61d1c1: septic ben savage pictures (Medium, Backlog)
- bd3d7de0: DMarie's Pizza Lighthouse (Critical) + Brimatco shared ticket
- 5b7cdcbd: Townsend Agency Lighthouse (Critical)
- 8d60044d: Manhattan Southington Lighthouse (Critical)
- da8e72d5: Refillpen Lighthouse (Critical)
- 18e5d5b3: Chai for Congress Lighthouse (Medium)
- 05e0e4e9: Middlebury Contracting Lighthouse (Medium)
- 172831f8: Southington Gardens Lighthouse (Medium)
- c05930c5: A & B Entertainment Lighthouse (Medium)
- a6e975c8: Marlin Roofing Lighthouse (Medium)
- de9a1ca9: Energy Busters Lighthouse (Medium)
- 686496df: 3Cs Tavern Lighthouse (Medium)
- 936b36d4: Li Zhai Art Lighthouse (Medium)

## Patterns
- **Lighthouse Audit Run (2026-03-31)** [Repeatable]
  - script: lh-audit campaign runs against all sites with Vercel project IDs
  - output: JSON reports + audit-report-YYYY-MM-DD.md + summary-YYYY-MM-DD.md
  - tickets: Created for all sites with perf <90 (13 new tickets this run)
  - note: Audit reports stored in memory/lh-audit/
