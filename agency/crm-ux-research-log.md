# CRM UX Research Log

## Session 1 — 2026-03-30 17:30 UTC
**Topic:** Progressive Disclosure in Ticketing CRMs

### Key Insights

1. **Show the most critical ticket data first.** Priority, status, and assignee should be visible at a glance without expanding anything. Secondary details (tags, custom fields, internal notes) stay hidden until needed.

2. **Use accordion/expand patterns for ticket detail views.** Collapse ticket threads by default; expand on click. This reduces cognitive load for agents scanning lists of 50+ tickets.

3. **Layer complexity gradually.** New users see simplified forms (subject, description, priority). Power users unlock custom fields, macros, and automation panels via toggle or "Advanced" sections.

4. **Contextual toolbars beat static ones.** Show only the actions relevant to the current ticket state — e.g., "Resolve" for open tickets, "Reopen" for closed ones. Hiding irrelevant actions reduces errors.

5. **Empty states are UX traps.** When a ticket has no notes, tags, or history, don't show blank space — show a helpful prompt with the most likely next action ("Add a note" or "Assign this ticket").

6. **Break long forms into steps (wizard pattern).** Multi-step ticket creation flows (Step 1: Contact → Step 2: Issue → Step 3: Resolution) reduce abandonment and improve data quality.

7. **Inline validation > error messages after submit.** Flag missing required fields as users type, not after they click Save. Reduces frustration and rework.

8. **Master-detail layouts scale better than modals.** For agents handling high ticket volumes, a split-pane (list left, detail right) lets them work without closing/opening contexts constantly.

### How It Applies to Our CRM

- Implement accordion collapses on ticket detail views to reduce visual clutter for agents handling large queues.
- Add a "Simple / Advanced" toggle on ticket creation forms so onboarding is smoother for new users while power features remain accessible.
- Replace any post-submit error states with inline, real-time validation.
- Use contextual action buttons — only show "Escalate" when a ticket is open, not when it's already resolved.

---

## Session 2 — 2026-03-30 18:30 UTC
**Topic:** Search & Filter UX for High-Volume Ticket Queues

### Key Insights

1. **Instant/fuzzy search beats submit-and-wait.** Agents need results as they type, with matches highlighted. Debounce queries by ~200–300ms to avoid thrashing. Fuzzy matching (typo tolerance) is non-negotiable in ticket systems where agents type fast.

2. **Filter chips > dropdown walls.** Show active filters as removable chips above the ticket list. This makes it instantly clear what's being filtered and lets agents clear one filter without hunting through a dropdown menu.

3. **Sort should be visible and persistent.** Default sort (e.g., oldest open first, or SLA urgency) should be obvious. Let agents override it, and remember their preference per-view. Never make users re-sort every session.

4. **Combine saved views + quick filters.** Allow agents to save a "High Priority Open" view as a one-click preset. Layer quick filters on top for ad-hoc refinement without losing the saved base.

5. **Highlight matching text in results.** When searching "payment issue", bold/colour the matching term in subject and description snippets so agents can scan results without opening each ticket.

6. **Empty search results need a path forward.** Show "No tickets match your search" + suggested actions: clear filters, broaden search, or create a new ticket. Don't leave agents stranded.

7. **Keyboard-first navigation is a must.** Arrow keys to navigate results, Enter to open, `/` to focus search, `Esc` to clear and return to list. Agents doing 200+ searches/day will thank you.

8. **Faceted filtering for multi-attribute tickets.** Allow filtering by status + assignee + priority + tag simultaneously. Each facet should show a count of matching tickets so agents know if a filter will actually narrow things down.

9. **Natural language query parsing is a differentiator.** Allowing queries like `status:open assignee:me priority:high created:today` gives power users a fast alternative to clicking through dropdowns.

### How It Applies to Our CRM

- Implement debounced instant search with fuzzy matching and highlighted result snippets in the ticket list.
- Replace multi-level filter dropdowns with a chip-based filter bar showing active constraints.
- Add a "Saved Views" dropdown (e.g., "My Open Tickets", "Unassigned High Priority") as a first-class feature.
- Introduce keyboard shortcuts: `/` to focus search, `↑↓` to navigate, `Enter` to open, `Esc` to clear.
- Consider natural language query syntax as an advanced option for power users who handle high volumes.

---

## Session 3 — 2026-03-30 19:30 UTC
**Topic:** Notification & Alert UX for Support Agents

### Key Insights

1. **Signal vs. noise is existential for agents.** A support agent on a busy queue can't afford to miss a high-priority ticket — but they also can't afford to be distracted by low-stale alerts. Every notification must earn its interruption. Triage notification types by real urgency (SLA breach, customer reply, mention) vs. informational (ticket closed, stats update).

2. **In-app notifications need a persistent, scannable centre.** A dedicated notification panel (bell icon → dropdown or sidebar) that lists recent alerts with timestamps and ticket references lets agents catch up after being away. Grouping by ticket thread reduces noise. Linear and Slack do this well — each notification is a jump link, not just a badge count.

3. **Badge counts are coarse, not actionable.** Red dots and numbers communicate "something happened" but not *what* or *why*. Use badges only as a prompt to open the notification panel — never as the sole mechanism for critical alerts like SLA warnings.

4. **Sound should be optional and contextual.** Audio alerts for every new ticket are tolerable at low volume; audio for SLA breaches are genuinely useful. Let agents configure sound per notification type. Default to subtle or silent — they can opt into louder alerts.

5. **Snooze and digest modes reduce context-switching.** Allow agents to snooze non-urgent notifications for 15–30 minutes (while in a focused task) and receive a batched digest later. This respects flow state without losing track of pending work.

6. **"You were mentioned" notifications must be hyper-specific.** Generic "@johndoe mentioned you in a ticket" is useless if it doesn't show the ticket subject or what was said. Include a one-line snippet of the mention text so the agent can decide whether to drop everything.

7. **Desktop/browser push for SLA breaches only.** For high-stakes time-bound events (SLA at risk, customer escalation), push notifications outside the browser tab are justified. For routine ticket assignments or replies, in-app is sufficient. Over-push kills trust in the alert system.

8. **Allow per-channel routing.** Some agents prefer email digests, others want Slack pings, others want browser pushes. Letting agents configure *where* they receive *which* notification type means fewer missed alerts and less "notification fatigue."

9. **Unread vs. read state must be crystal clear.** Agents should never wonder "did I already see this?" Read/unread must be visually distinct (colour, weight, checkmark) and the transition must be intentional — opening a notification shouldn't auto-mark it read if they might need to return.

10. **Batch low-urgency notifications into a daily summary.** Ticket queue stats, team updates, resolved-ticket summaries — these have no business interrupting an agent mid-ticket. A daily "Morning Brief" email or in-app digest at shift start is far better UX than drip-feeding these throughout the day.

### How It Applies to Our CRM

- Build a dedicated notification centre (bell icon → panel) showing grouped, timestamped alerts with ticket jump links. No badge-count-only alerts for critical events.
- Route SLA-breach and escalation alerts via browser push; routine replies and assignments stay in-app.
- Include mention snippets in "@agent" notifications — ticket subject + one-line quote so agents can triage instantly.
- Add snooze (15/30/60 min) and per-type sound toggles in notification settings.
- Offer a daily digest option for non-urgent updates (stats, resolved tickets) delivered at shift start.
- Ensure read/unread state is visually clear and persists — agents must be able to return to a notification after closing it.
