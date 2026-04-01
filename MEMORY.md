# MEMORY.md — Long-Term Memory

## Important Rules
**Do NOT push code to git.** Keep knowledge local only. Do not run `git push` or any git push operations.

## Who I Am Helping
- **Name:** Sean Conway
- **Contact:** +1 879-430-6096 (Telegram)
- **GitHub:** SeanConway102
- **Timezone:** Eastern

## Active Projects
- **Client Portal** — `~/clawd/agency/client-portal/` | Spec: `agency/client-portal/SPEC.md` | Phase 0 done, Phase 1 WIP, Phase 6 near-complete | Auth: NextAuth v5 | Multi-tenancy: path-based + subdomain per client | Vercel: `v0-client-portal-*.vercel.app`
- **CRM System** — See `agency/skills/crm-api/SKILL.md` for full API reference | Frontend: `v0-crm-frontend-build-peach.vercel.app` | Backend repo: SeanConway102/crm | Frontend repo: SeanConway102/crm-frontend
- **Credentials** — CRM key: `~/.openclaw/workspace-agency/.crm-key` | Other env vars in `~/.bashrc` | Do NOT hardcode keys

## Architecture Decisions
- Feature flags: page-level enforcement (middleware CANNOT use Prisma on Edge Runtime)
- Billing: CRM owns subscriptions + invoices; portal embeds Stripe Elements
- TDD: Vitest (unit/integration) + Cucumber + Playwright (BDD E2E)
- No trials — pay upfront; manual one-by-one onboarding
- Session user ID: propagate via `token.id -> session.user.id` in NextAuth callbacks

## Key Bugs Caught
- `globals.css` duplicate `--accent` var: removed (kept indigo #6366F1)
- `session.user.id` not propagated in JWT callback: fixed
- `@next/third-parties` incompatible with Next.js v16: replaced with vanilla gtag.js
- Switch import path: `./actions` not `../actions`
- DB key format: `tenantId:flagId` not `tenantId:flagKey`
- CRM Dashboard all-0s: known, not yet fixed
- Duplicate fairwayirrigationandlawn.com rows: known, not yet fixed

## Lighthouse Audit (2026-03-31)
19 sites audited. Critical (<60): DMarie Pizza (27), Townsend Agency (25), Manhattan Southington (43), Refillpen (42), Chai for Congress (51), Brimatco (56), Middlebury Contracting (57), Southington Gardens (59), A&B Entertainment (60). Reports: `memory/lh-audit/`

## Pointers
- Client sites & graph: `agency/memory/graph.md`
- CRM API reference: `agency/skills/crm-api/SKILL.md`
- Research log: `memory/research-log.md` (~48KB)
- Daily logs: `memory/YYYY-MM-DD.md`
- Open tickets: see `agency/memory/graph.md` (Open Tickets section)

## CRM Credentials
- **URL:** https://v0-crm-frontend-build-peach.vercel.app (or `crm-frontend-2evvh0r7i-*.vercel.app` after deploy)
- **Email:** sully@ctwebsiteco.com
- **Password:** SullyAgent2026
- **API:** crm-api-1016182607730.us-east1.run.app (MCP endpoint at `/mcp`, auth via `X-API-Key`)
- CRM API key: `~/.openclaw/workspace-agency/.crm-key`

## GitHub / Auth
- Global git identity: `Sean Conway <srconway0@gmail.com>`
- PAT in `~/.git-credentials`; last rotated 2026-03-31
