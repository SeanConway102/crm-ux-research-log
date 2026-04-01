---
name: crm-api
description: CRM Backend API reference — endpoints, auth, DTO field mappings, gotchas. Use when making CRM API calls or debugging CRM issues.
---

# CRM API Reference

## Connection
- **API Base:** https://crm-api-1016182607730.us-east1.run.app
- **Auth:** `X-API-Key` header (NOT `Authorization: Bearer`)
- **API Key:** read from `~/.openclaw/workspace-agency/.crm-key` — NEVER hardcode
- **MCP:** https://crm-api-1016182607730.us-east1.run.app/mcp (streamable-http)
- **Knowledge Base MCP:** https://crm-api-1016182607730.us-east1.run.app/kb-mcp

## Cold Start Warning
Cloud Run cold-starts in ~2-3s. Always use `--connect-timeout 10 --max-time 30` with curl. If timeout, retry once — second call is fast (~0.1s). Never assume API is down after a single timeout.

## Curl Pattern
```bash
curl -s --connect-timeout 10 --max-time 30 \
  -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  https://crm-api-1016182607730.us-east1.run.app/{endpoint}
```

## Your Identity
Logged in as **Sully** (sully@ctwebsiteco.com, admin, user ID: fcc77e15-ea54-43ca-8e53-b1caa727a46f).

## Endpoints

All routes under `/api/v1/` unless noted.

### Deals
- `GET /api/deals` — list (supports ?status=, ?search=)
- `GET /api/deals/{id}` — detail
- `PUT /api/deals/{id}/stage` — move stage (body: `{"stage": "..."}`)

### Pipeline & Revenue
- `GET /api/pipeline/summary` — deal count, total value, by stage
- `GET /api/revenue/forecast` — revenue forecast

### Activities
- `GET /api/activities?overdue=true` — overdue activities
- `POST /api/activities` — create (body: `{"type": "call", "contact_id": "...", "notes": "..."}`)

### Notes
- `POST /api/notes` — create note on deal/contact

### Tickets
- `POST /api/v1/tickets` — create (body: `{"subject": "...", "priority": "high", "description": "..."}`)
- `PUT /api/v1/tickets/{id}` — update (fields: subject, description, assigned_to, status, priority, category)
- `GET /api/v1/tickets?assigned_to=fcc77e15-ea54-43ca-8e53-b1caa727a46f&status=Backlog` — your queue
  - **BUG:** `/tickets/queue` endpoint is broken, use filter instead
- `GET /api/v1/tickets/{id}` — ticket detail
- `GET /api/v1/tickets/{id}/comments` — ticket comments
- `POST /api/v1/tickets/{id}/comments` — add comment (body: `{"body": "..."}`)

### Agent Runs
- `PUT /api/v1/agent-runs/{runId}` — update status (body: `{"status": "completed", "output": "..."}`)

### Contacts
- `GET /api/contacts?search={name}` — search contacts

### Lighthouse
- `GET /api/lighthouse/latest?url={site_url}` — latest scores
- `GET /api/lighthouse/history?url={site_url}` — score history

### Health
- `GET /health` — health check

### Discovery
- `GET /api/` or `GET /api/docs` — discover routes

## DTO Gotchas (Memorize These!)
- **Deal:** `title` NOT `name`, `expected_close_at` NOT `expected_close_date`
- **Activity:** `duration_mins` (integer)
- **Ticket:** `subject` NOT `title`
- **Contact:** `lead_source` (values: website/referral/social/cold_outreach/partner/event/other)
- **Company:** `size` NOT `employees`
- **All entities:** `assigned_to` for user assignment (UUID)
- **JSON:** `DisallowUnknownFields` — unknown fields in request body cause 400
- **Durations:** Go format only (`168h` not `7d`)

## Architecture
- **Runtime:** Go on Google Cloud Run (us-east1, project ctwebsiteco)
- **Database:** Neon Postgres (serverless), migrations via golang-migrate
- **Auth:** API key in `X-API-Key` header, keys in GCP Secret Manager
- **Docker dev ports:** Postgres 5435, Redis 6381, API 8090

## Webhook Handling (Ticket Assignment)
When receiving a ticket assignment or @mention via webhook:
1. Fetch ticket: `GET /api/v1/tickets/{ticketId}`
2. Fetch comments: `GET /api/v1/tickets/{ticketId}/comments`
3. Analyze and take action
4. Post response: `POST /api/v1/tickets/{ticketId}/comments` with `{"body": "..."}`
5. Update AgentRun: `PUT /api/v1/agent-runs/{runId}` with `{"status": "completed", "output": "..."}`

## Environment Variables
- `$CRM_API_KEY` — CRM API auth (also at ~/.openclaw/workspace-agency/.crm-key)
- `$RESEND_API_KEY` — Resend email API
- `$SANITY_API_TOKEN` — Sanity CMS (project: $SANITY_PROJECT_ID = 553hmjo2)
- `$SANITY_PROJECT_ID` — 553hmjo2
- `$VERCEL_TOKEN` — Vercel PAT
- `$JINA_API_KEY` — via Jina MCP tools
- `$MINIMAX_API_KEY` — LLM backend (do not use directly)
- `$DATABASE_URL` — Neon Postgres read-only access (role: sully_readonly)

## Database Direct Access (Read-Only)
```bash
psql "$DATABASE_URL" -c "SELECT column FROM table WHERE condition LIMIT 10"
```
- Role: `sully_readonly` (SELECT only, 115 tables)
- NEVER attempt writes
- Use for: complex joins, aggregates, debugging, data exploration

## Common Telegram Commands
- "Log a call with {person}" → POST /api/activities + /api/notes
- "Move {deal} to {stage}" → PUT /api/deals/{id}/stage
- "Create ticket: {desc}" → POST /api/v1/tickets
- "My tickets" → GET /api/v1/tickets?assigned_to=...&status=Backlog
- "Pipeline this month" → GET /api/pipeline/summary
- "What is overdue?" → GET /api/activities?overdue=true

## Client Site Patterns
- **Stack:** Next.js App Router + Tailwind CSS + shadcn/ui + Sanity CMS
- **Hosting:** Vercel (team: sean-conways-projects-e1b94122)
- **CMS:** Sanity (project 553hmjo2, dataset: production)
- **Email:** Resend with per-client domain-scoped API keys
- **Analytics:** GA4 with generate_lead key event
- **Images:** `sanityImageUrl(img).url()` + `unoptimized` + `priority` for hero
- **Forms:** zod validation + dual Resend emails + GA4 generate_lead
- **Queries:** `defineQuery` + `sanityFetch` with tags for revalidation
- **Draft mode:** `/api/draft?secret=DRAFT_MODE_SECRET`
- **Always SSR pages** (no "use client" on page files)

## Production Credentials
- CRM API key: `~/.openclaw/workspace-agency/.crm-key`
- GitHub org: ctwebsiteco
- Sanity project: 553hmjo2
- Vercel team: sean-conways-projects-e1b94122
