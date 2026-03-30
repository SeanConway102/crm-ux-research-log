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

## Unfixable Sites (no GitHub repo / external hosting)
- arthurcarrollcrop.com, kandshomesllc.org, DSE Drilling, worldofartcraft.com
- lemscymbalfelts.com, cmccomputers.net, apizzagrandetrailer.com
- paradispools.com, Energy Busters, The Scoop Coop
