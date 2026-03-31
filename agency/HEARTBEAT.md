# Heartbeat Checks (runs every 30 minutes)

## Context Hygiene (EVERY heartbeat, do this FIRST)
- [ ] If mid-session: flush working context to `memory/YYYY-MM-DD.md` before proceeding
- [ ] Summarize any large tool outputs from the last 30 min into 1-2 line notes in daily log

## Health Checks
- [ ] Hit https://crm-api-1016182607730.us-east1.run.app/health -- alert if status != 200
- [ ] Hit https://v0-crm-frontend-build-peach.vercel.app -- screenshot if it errors (non-200 or visible error)

## Token Status
- [ ] Check .env.local for OIDC token expiry (decode JWT, check `exp` claim)
- [ ] If token expires within 6 hours: run `vercel env pull .env.local` in the frontend dir
- [ ] If refresh succeeds, copy the new AI_GATEWAY credentials to backend/.env

## Active Development
During each heartbeat, pick ONE of the following and actually do work on it:
1. **CRM Tickets** -- Check your ticket queue (`GET /api/v1/tickets?assigned_to=fcc77e15-ea54-43ca-8e53-b1caa727a46f&status=Backlog`), pick up a ticket, make progress
2. **PR Reviews** -- Check open PRs on GitHub (`gh pr list`), review one, leave comments
3. **Git Status** -- Check both repos for uncommitted changes >24h old, warn or commit
4. **Cache/Code Fixes** -- Look at CRM issues, pick one labeled `bug` or `good-first-issue`, implement it
5. **Client Site QA** -- Pick a recent Vercel deployment, run exploratory test, report findings

## Quick Status (report only if issues found)
- [ ] Check `git status` in both repos -- warn if uncommitted changes older than 24h

---

## Scheduled Cycles (check current time, run if window matches)

### Nightly Dream (02:00-04:00 ET, daily)
Check current time. If between 02:00-04:00 ET AND `memory/dream-log.md` has no entry for today:
- [ ] Run the **dream** skill (4-phase memory consolidation)
- [ ] Update `memory/graph.md` with any new entities from the day
- [ ] Stay quiet -- NO Telegram notification unless issues found during consolidation

### Daily Standup (08:00-09:00 ET, weekdays)
Check current time. If between 08:00-09:00 ET AND today's daily log has no `## Daily Standup`:
- [ ] Check ticket queue, open PRs, any overnight alerts
- [ ] Write a `## Daily Standup` section in today's `memory/YYYY-MM-DD.md`
- [ ] Send brief standup summary to Sean via Telegram:
  - What was done yesterday
  - What's planned today
  - Any blockers

### Weekly Review (Monday 09:00-10:00 ET)
Check current time. If Monday between 09:00-10:00 ET AND no weekly file for this week:
- [ ] Read daily logs from the past 7 days
- [ ] Count: tickets resolved, PRs merged, sites audited, incidents handled
- [ ] Note: recurring patterns, blockers, improvements
- [ ] Write to `memory/weekly/YYYY-WNN.md`
- [ ] Send weekly digest to Sean via Telegram

---

After each active heartbeat, send a brief message to Sean summarizing what was worked on (even if incomplete -- momentum matters).
