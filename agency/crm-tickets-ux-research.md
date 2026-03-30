# CRM Ticketing System — UX Research & Improvement Plan

## Research Summary

### What Good Ticketing Systems Do (Linear, Height, Jira, Zendesk)

**Linear** — gold standard for modern ticketing/issue tracking:
- Ultra-fast keyboard-first navigation
- Every list is filterable with instant results
- Issue cards are scannable: priority icon + title + assignee avatar + label dots
- "My Issues" view is prominent — defaults to show assignee-filtered view
- Cycles/sprints for time-bound work
- AI agent integration for auto-triage
- Slugs (e.g., ENG-2085) for easy issue referencing

**Zendesk/Support-focused** — good for SLA management:
- Clear SLA countdown timers
- First response / next response / resolution time tracking
- Customer satisfaction (CSAT) at resolution
- Agent workload view
- Quick bulk actions on queues

**Key UX Principles Applied:**
1. **Fitts's Law** — important actions are large and close to the user
2. **Hick's Law** — reduce choices; smart defaults
3. **Jakob's Law** — users prefer systems that work like ones they already know
4. **Progressive Disclosure** — show most important info, reveal details on demand

---

## Current System Analysis

### Strengths ✅
- Kanban board with drag-and-drop (dnd-kit)
- Active vs terminal stage separation
- Priority badges with color coding
- SLA overdue indicators
- Assignee avatars on cards
- Company association
- Search + filtering + sorting
- Terminal drop zones with counts
- Optimistic updates on drag
- Real-time ticket mutation listener

### Weaknesses ❌

#### High Priority (Usability)
1. **"Assigned to Me" is buried** — small button in toolbar, not a primary view
2. **No quick filters** — can't one-click filter to "High + Urgent" or "Overdue"
3. **Board cards are dense** — too much text, hard to scan at a glance
4. **No WIP limits** — columns can accumulate unlimited tickets
5. **No bulk actions** — can't select and move/close multiple tickets
6. **No visual priority indicators** — only text badge, no icon sizing
7. **Hover on cards reveals nothing** — no peek or quick actions

#### Medium Priority (Experience)
8. **Closed tab uses `ticket.status`** — shows old status values instead of stage
9. **"Resolved At" column shows `updated_at`** — should show when stage changed to Resolved
10. **No SLA first-response tracking** — only resolution SLA shown
11. **No time-in-stage indicator** — don't know if ticket is stuck
12. **No "new tickets today" indicator** — would help morning standup
13. **Assignee filter is slow** — separate UserSelect API call on every render
14. **No keyboard shortcuts** — can't navigate tickets without mouse

#### Lower Priority (Polish)
15. **No issue slugs** — tickets referenced by UUID, not human-readable
16. **No cycle/sprint concept** — no time-boxed grouping
17. **No story points/estimation**
18. **No time tracking**
19. **No bulk reassign**

---

## Improvement Roadmap

### Phase 1: Quick Wins (High Impact, Low Effort)
- [x] Fix closed tab to show stage instead of status ✅ (commit 6658ef0)
- [x] Fix "Resolved At" to use actual stage change timestamp ✅ (commit 6658ef0)
- [x] Add prominent "My Tickets" filter button ✅ (commit 6658ef0)
- [x] Add overdue + priority quick filter chips ✅ (commit 6658ef0)
- [x] Reduce card density — show less text, more whitespace ✅ (commit 5fb4c10)
- [x] Hover assignee name tooltip ✅ (commit 5fb4c10)
- [x] WIP limits on board columns ✅ (commit 0afc7d6)
- [x] "New today" badge on tickets ✅ (commit 0afc7d6)

### Phase 2: Meaningful Improvements (Medium Effort)
- [ ] Bulk selection and actions
- [ ] "Time in stage" indicator on cards (needs stage history API)
- [x] SLA countdown on board column headers ✅ (commit 7d26102)
- [ ] Keyboard navigation (j/k to move, Enter to open, Esc to close)
- [x] Visual priority icons (urgent 🔴, high 🟠) ✅ (commit ffcd1ab)

### Phase 3: Advanced Features (Higher Effort)
- [ ] Issue slugs (tkt-123 format)
- [ ] Cycles/sprints
- [ ] Agent workload view
- [ ] First response SLA tracking
- [ ] Ticket templates (common issue types)
- [ ] Linked issues hierarchy
