# CRM Grooming Session — 2026-04-01 12:03 UTC

## Tickets Reviewed: ~101 total

### Resolved/Closed/Cancelled: skipped
- ~75 tickets in terminal states

### Unresolved (active queue): ~26 tickets

## Step 2: Grooming Actions

### Assignments Made
1. **brimatco LH 51** (50a291dc) → assigned to Sully ✓
2. **A&B Entertainment LH 48** (59b18078) → assigned to Sully ✓
3. **EnergyBustersLTD LH 57** (04d4476d) → already assigned to Sully (from prior session)

### Duplicate Check
- **A&B Entertainment** tickets: c05930c5 (LH 60, In Progress) and 59b18078 (LH 48, just assigned) — these cover the same site (abentertainment.com). c05930c5 is more detailed (references bailout_to_client_side_rendering, specific branch). 59b18078 appears to be a fresh scan result. Recommendation: consolidate by keeping c05930c5 as primary, closing 59b18078. **NOT actioned** — requires deciding which ticket to keep.

- **3Cs Tavern** tickets: 686496df (Backlog, LH 62) and eaf8268d (Backlog, LH 46→85+) — both for 3Cs Tavern. eaf8268d is the detailed original with root cause analysis. 686496df is a newer scan result. Recommendation: close 686496df as duplicate, keep eaf8268d. **NOT actioned.**

- **Apizza Grande**: 19ec83a2 (Closed, LH 55) and 425a1b95 (In Progress, LH 45) and 686496df (Wait — Apizza Grande trailer has 3 tickets). All appear to be the same site. **NOT actioned.**

### Vague Tickets (needs client response)
1. **Amy Chai Pictures** (75d4a7d8) — posted 2 comments previously asking for clarification. Followed up with 3rd comment this session. **Still waiting.** ⚠️ Blocked since March 23rd.
2. **Septic Ben Savage pictures** (cd61d1c1) — had grooming note but no formal comment posted. **Needs comment posted.**
3. **AB ENTERTAINMENT favicon** (c6bb8b0d) — vague. Asked previously but no response. **Needs follow-up comment.**

### Blocked Tickets (external dependency)
- **Townsend Agency** (5b7cdcbd) — site still on UENI, not deployed to Next.js. BLOCKING: needs DNS change + Vercel deploy by Sean. Assigned to Sully but can't work it.
- **DMarie's Pizza** (0b07b802) — WebsiteBuilder.com site, not Next.js. BLOCKING: needs client discussion about scope. Can't do code fixes.

## Step 3: Work Done — Apizza Grande (v0-apizza-grande-website)

### Problem
- Hero images: pizza-1.jpg, pizza-2.jpg, pizza-3.jpg — PNG files named as .jpg, 651×511px, ~240KB each
- Page images: pizza-truck.jpg (444KB), restaurant.jpg (444KB), event images (171-306KB)
- All loaded as JPEG/PNG, no WebP optimization
- TypeScript errors blocking clean build (GA lazyOnload prop, tailwind darkMode type)

### Changes Made (committed to perf/lighthouse-90)
1. **Converted all hero + page images to WebP** (50-68% size reduction):
   - pizza-1,pizza-2,pizza-3: 240KB PNG → ~97KB WebP (52-59% reduction)
   - pizza-truck.jpg: 444KB → 141KB WebP (68% reduction)
   - restaurant.jpg: 444KB → 141KB WebP (68% reduction)
   - event-brewery, event-festival: converted to WebP (28-46% reduction)

2. **Fixed TypeScript errors**:
   - Removed invalid `lazyOnload` prop from GoogleAnalytics component
   - Fixed `darkMode: ["class"]` → `darkMode: "class"` in tailwind.config.ts

### Expected Impact
- LCP improvement: hero images now ~50% smaller
- FCP improvement: page renders faster with smaller images
- TypeScript now passes cleanly

### BLOCKED: Push to GitHub Failed
```
fatal: could not read Password for 'https://github_pat_...@github.com': No such device or address
```
GitHub write access blocked — git trying to read from non-existent keyring device. Same issue as A&B Entertainment (c05930c5).

## High Priority Queue (Sully's)
| Ticket | Site | Perf | LCP | Status | Blocker |
|--------|------|------|-----|--------|---------|
| Townsend Agency | thetownsendagencyhomecare.com | 25 | 21.2s | Backlog | DNS/Deploy (Sean) |
| DMarie's Pizza | dmariespizza.com | 27 | 37.0s | In Progress | Scope (WebsiteBuilder) |
| A & B Entertainment | abentertainment.com | 60→48 | 5.7s | In Progress | GitHub push blocked |
| Apizza Grande | apizzagrandetrailer.com | 55 | 7.9s | In Progress | GitHub push blocked |
| Manhattan Southington | manhattansouthington.com | 43 | 25.0s | Backlog | None |
| Chai for Congress | chaiforcongress.com | 51 | 11.4s | Backlog | None |
| Refillpen | refillpen.com | 30 | 12.3s | Backlog | No codebase found |

## Open Questions
1. Abort DMarie's Pizza (WebsiteBuilder scope)?
2. Close 3Cs Tavern duplicate (686496df)?
3. Abort Apizza Grande push blocked — escalate?
4. No codebase found for Refillpen — close or find repo?
