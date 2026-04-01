# CRM Grooming Session — 2026-04-01 00:21 UTC

## Tickets Reviewed: ~65 total

### Unresolved (not Resolved/Closed/Cancelled): ~22 tickets
- 14 Lighthouse performance tickets (all assigned to Sully)
- 2 vague tickets needing clarification (Amy Chai Pictures, Septic Ben Savage)
- 1 mis-assigned ticket (Middlebury image → reassigned from Sean to Sully)
- 5 other tickets (Push Live, Sales, Architecture)

## Actions Taken

### 1. Comments Posted (from prior session, already resolved)
- Amy Chai Pictures (75d4a7d8): Asked for site, specific pictures, location on pages
- Septic Ben Savage (cd61d1c1): Asked for target site, page location, change type

### 2. Reassignment
- **Middlebury Contracting image update** (3bf13556): Reassigned Sean Conway → Sully
  - Reason: Technical Sanity CMS work, not architecture. Note said "Mark can't do it because of the 'Insanity System' (Sanity CMS)" - this is Sully's domain.

### 3. Work Done — Townsend Agency (5b7cdcbd) — Performance 25
- **Root cause identified**: Hero image fetched at 800×1000px (severely undersized for desktop)
- **Fix 1**: Increased hero image to 1920×2400px in `app/page.tsx`
- **Fix 2**: Added `metadataBase: new URL(...)` to layout for canonical URL resolution
- **Commit**: c7f8681 — pushed to GitHub (Vercel auto-deploy triggered)
- **Still needed**: Accessibility audit (score 59), Best-Practices fix (score 57), SEO improvements (score 77)

### 4. No Duplicates Found
- AB Entertainment favicon (c6bb8b0d) is separate from AB Entertainment Lighthouse (c05930c5) — different issues
- Southington Gardens old resolved ticket (62b5b5d4, Performance 69) vs new Backlog ticket (172831f8, Performance 59) — likely score drift, same site

## Key Findings

### Vague Tickets (blocked, needs response)
1. **AMY CHAI PICTURES** (75d4a7d8) — "WE NEED TO GET THESE DONE" — no site, no specifics
2. **Septic Ben Savage pictures** (cd61d1c1) — Dropbox link present, but no site URL or page location

### High Priority Lighthouse Queue (Sully's)
| Ticket | Site | Performance | LCP | Status |
|--------|------|-------------|-----|--------|
| Townsend Agency | thetownsendagencyhomecare.com | 25 | 21.2s | **In Progress** (fix deployed) |
| DMarie's Pizza | dmariespizza.com | 27 | 40.7s | In Progress (WebsiteBuilder - scope issue) |
| Apizza Grande | apizzagrandetrailer.com | 45 | 7.57s | In Progress |
| A & B Entertainment | abentertainment.com | 60 | 5.6s | In Progress |
| Li Zhai Art | lizhaiartschools.com | 69 | 4.8s | To Do |

### Mis-assignments Found
- Middlebury image update (3bf13556) — Sean → Sully ✓ (fixed)
