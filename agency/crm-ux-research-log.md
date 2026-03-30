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

---

## Session 4 — 2026-03-30 20:30 UTC
**Topic:** Internal Notes vs. Public Reply UX in Ticketing Systems

### Key Insights

1. **Make the Internal/Public toggle visually unambiguous — and the default logical.** Agents must instantly know which mode they're in before typing. A prominent pill toggle or tab (not a tiny dropdown buried below the text area) prevents accidental public replies. Default should match the agent's most likely action for the current ticket state.

2. **Visual differentiation must survive colour-blindness.** Using only green (internal) vs. blue (public) fails for colour-blind users. Use distinct icons (🔒 vs. 💬), labels, and background tints alongside colour to make mode instantly scannable.

3. **Don't hide internal notes from other agents.** Internal notes are for *customer opacity*, not *team opacity*. If two agents are on the same ticket, both should see each other's internal notes without clicking anything. Hiding notes from teammates creates duplicated effort and frustration.

4. **Preserve mode state per ticket, not globally.** Agents often switch between internal-then-public on the same ticket. Remember the last mode used on each ticket and restore it when reopening — Zendesk's failure to do this is a common pain point.

5. **Threaded/chronological mixing is a UX anti-pattern.** Don't dump internal notes and public replies into one chronological stream with no visual separator. Use alternating backgrounds, dividers, or a side-by-side split (notes left, replies right) so agents instantly know which is which without reading timestamps.

6. **Warn before sending a public reply that contains internal context.** If an agent's draft includes text like "they're lying about…" or "escalate to Tier 2" and they're about to send publicly, surface a confirmation prompt. One accidental public disclosure can destroy trust.

7. **Allow agents to convert a note to a reply (and vice versa) before sending.** Context shifts — an agent may start a note but then decide the information is useful for the customer. Let them switch modes without losing draft content.

8. **Show who can see each type at the top of the composer.** A one-line label like "Visible to: Your team only" vs. "Visible to: Customer + Your team" right above the text area eliminates ambiguity before the agent invests time in drafting.

9. **Internal note drafts should persist across ticket switches.** If an agent is mid-note on Ticket #404 and gets pulled to Ticket #500, they shouldn't lose their draft. Auto-save all composer content (per ticket) so context-switching is safe.

10. **Collapsible internal note threads reduce visual noise.** For tickets with heavy back-and-forth between agents, collapse older internal notes by default with a "Show N hidden notes" toggle. Keeps the customer-facing context clean and prominent.

### How It Applies to Our CRM

- Add a persistent, icon+colour+label mode toggle in the reply composer — not buried in a dropdown.
- Default mode should be contextual: "Reply" for customer-pending tickets, "Internal Note" for escalated/in-progress tickets where agents are collaborating.
- Implement a visual split or clearly delineated alternating thread for internal vs. public comments — never mixed without separators.
- Add a pre-send warning if a public reply contains words commonly associated with internal-only context (flagged phrases).
- Auto-save composer content per ticket; preserve last-used mode per ticket when reopening.
- Collapse older internal note threads behind a toggle to keep ticket detail views readable.
- Expose visibility scope ("Team only" / "Customer visible") as a label above the composer at all times.

---

## Session 5 — 2026-03-30 21:30 UTC
**Topic:** SLA & Deadline Visualization UX for Ticketing Agents

### Key Insights

1. **Live countdown timers belong inside the ticket view, not just in a sidebar.** Agents need to see the deadline while actively working a ticket — not have to context-switch to find it. When the SLA timer is embedded directly in the ticket header, the psychology shifts: agents work *against* the clock rather than forgetting about it entirely. Jira and Zendesk both surface this in-ticket; it's table stakes.

2. **Four-state visual escalation: Normal → Warning → Critical → Breached.** Use consistent, colour-blind-safe states: green (plenty of time), amber/yellow (warning threshold hit, e.g., <30 min or <25% remaining), red (critical, <15 min or <10%), and grey/strikethrough for breached. Never rely on colour alone — pair with icons and text labels.

3. **Warning thresholds must be configurable per SLA policy.** A 4-hour SLA and a 2-week SLA need different warning triggers. Allow admins to set warning at a fixed time (e.g., "warn at 30 min remaining") and/or a percentage (e.g., "warn at 20% time remaining"). One size fits no one.

4. **The SLA clock should pause when the customer is waiting.** Auto-pause timers during "Customer is reviewing" or "Pending customer response" states. Agents lose trust in SLA systems that count time they're not in control of. Hiver and HappyFox both do this; agents notice and appreciate it.

5. **Show a mini SLA status bar in the ticket list/queue view.** A thin coloured bar or cell-level indicator (green/amber/red) against each ticket row gives agents instant triage capability across their queue without opening individual tickets. Sortable by SLA urgency is equally important.

6. **Breach forgiveness: one-click SLA extension requests.** When agents hit a genuine edge case (customer went silent, complex escalation), a single-click "Request 1hr extension" with a required reason string lets them act without interrupting a supervisor. Reduces both breaches and supervisor interruptions.

7. **Breached tickets need a "Time Past Breach" display, not just a red badge.** Showing "-00:47:23" (47 minutes overdue) is more actionable than just "Breached". It helps agents decide whether to escalate immediately or deprioritise in favour of less-delayed tickets.

8. **Predictive breach warnings before the warning threshold.** If a ticket has been open for 3h45m on a 4-hour SLA, flag it as "at risk" even before the formal warning threshold. Some CRMs use a gradient indicator that shifts from green → amber as time runs down, making at-risk state visible at a glance across the queue.

9. **SLA policy must be transparent to agents at all times.** Agents should never guess which SLA applies. Show the active SLA name ("Priority: Urgent — 1hr Response") and its full terms in the ticket header. If the customer upgrades the plan mid-ticket, the SLA should update immediately with a visible change notification.

10. **Suppress SLA timers for closed/resolved tickets — but keep breach history visible.** There's no point counting down a resolved ticket, but knowing "Breached by 2h12m" on a resolved ticket matters for reporting, customer apology templates, and manager review. Store it, hide the countdown, surface the history.

### How It Applies to Our CRM

- Embed a live countdown timer in the ticket detail header — always visible while the ticket is open, never hidden behind a tab or sidebar.
- Implement a four-state colour+icon SLA indicator (Normal/Warning/Critical/Breached) that is colour-blind accessible, with configurable thresholds per SLA policy.
- Add a sortable SLA status column (colour-coded bar + time remaining) to the ticket list view so agents can triage by urgency without opening tickets.
- Auto-pause timers when a ticket enters a customer-waiting state; surface the paused duration transparently so agents know why the clock stopped.
- Show "Time Past Breach" on breached tickets, not just a static badge.
- Add a one-click "Request Extension" action (with reason field) on at-risk tickets so agents can self-serve without interrupting a supervisor.
- Make the active SLA policy name and terms visible in the ticket header at all times — never buried in a settings panel.

---

## Session 6 — 2026-03-30 22:30 UTC
**Topic:** Bulk Actions & Multi-Select UX for High-Volume Ticket Queues

### Key Insights

1. **"Select All" must be scope-aware — and say so.** A bare "Select All" is ambiguous when filters are active. It should read "Select all 47 tickets" or "Select all 847 tickets (matching current filters)" to avoid accidentally bulk-applying actions to tickets outside the current view. Gmail gets this right; many CRMs don't.

2. **A contextual action bar appears after selection — it doesn't exist before.** The pattern: user selects items → a floating/sticky action bar animates in (Assign, Change Status, Add Tag, Close). This keeps the UI clean before selection and avoids polluting the interface with controls that do nothing until items are chosen. Kill it (deselect all) → bar disappears.

3. **Communicate eligibility before the action, not after.** If 3 of 12 selected tickets are already resolved and the agent tries to "Close" them, surface this *before* submitting — show "3 tickets already closed" inline with the action button disabled, and tooltip explaining why. Never silently skip items or apply actions partially without explanation.

4. **Checkbox targets must be ≥24×24px with visible hover affordances.** Row-level checkboxes that appear only on hover are a known failure pattern — agents scanning a list miss them entirely. Keep checkboxes always visible (or at minimum, provide a very obvious hover affordance). Row hover highlighting should signal "this row is interactive."

5. **Bulk actions must be reversible or have clear confirmation for destructive ops.** Close, Delete, and reassign-SLA are high-stakes. Show a confirmation summary: "Close 12 tickets" → dialog listing each ticket subject or a count if >5. For less destructive actions (add tag, change priority), optimistic apply + undo toast (5–10s window) is faster and less disruptive than a modal.

6. **Pagination breaks bulk selection — fix it explicitly.** If an agent selects 10 tickets on page 1, switches to page 2, selects 10 more, then tries a bulk action — the system must either preserve selection across pages or warn clearly: "Bulk actions apply to the 10 tickets on this page. To apply to all selected across pages, use 'Select all N matching.'" Don't silently lose their multi-page selection.

7. **Keyboard multi-select accelerates high-volume workflows.** `Shift+Click` for range select, `Cmd/Ctrl+Click` for toggle, `Cmd/Ctrl+A` to select all on page. A "Select all visible" shortcut in the toolbar (or `/` to focus search + `Cmd+A`) makes power users dramatically faster. Always pair with `Esc` to clear selection.

8. **Bulk edit flows need per-field "Apply to all" vs. "Clear existing" semantics.** When bulk-editing tickets (e.g., changing assignee or priority), some fields should replace existing values, others should only apply to tickets that don't already have a value. Let agents choose: "Set assignee to Sarah — *overwrite existing?* Yes / No." Ambiguity here causes data corruption.

9. **Progress feedback for bulk operations is non-negotiable.** Bulk-closing 200 tickets shouldn't show a spinner for 30 seconds with no feedback. Use a progress indicator ("Closing tickets: 47/200") or at minimum an optimistic update with a后台 job status indicator. Show a completion summary: "✓ 198 closed. 2 skipped (already resolved)."

10. **Saved bulk action macros save real agents hours per week.** Let teams save "Close + Tag: spam" or "Reassign to Tier-2 + Add internal note" as reusable macros. Named clearly, one-click to execute. For teams handling 500+ tickets/day, this is the difference between a CRM that feels like a生产力 tool and one that feels like a spreadsheet.

### How It Applies to Our CRM

- Add a sticky contextual action bar (Assign, Set Status, Add Tag, Close) that appears on first ticket selection and disappears on deselect.
- Make row checkboxes always visible — don't hide them on hover. Row hover highlight as affordance.
- Implement scope-aware "Select all N (matching filters)" in the checkbox column header.
- For bulk actions on mixed-state tickets, show eligibility warnings inline before submission (e.g., "N tickets already closed — will be skipped").
- Support Shift+Click range select and Cmd/Ctrl+Click toggle; `Cmd+A` selects all on current page.
- Preserve selection across pagination with a persistent selection indicator and multi-page bulk apply option.
- Add a bulk-edit confirmation dialog with per-field overwrite toggle.
- Show real-time progress for bulk operations affecting >20 tickets.
- Introduce saved "Bulk Macros" — team-configurable one-click bulk action combos.

---

## Session 7 — 2026-03-30 23:30 UTC
**Topic:** Ticket Merging & Threading UX for Duplicate & Linked Tickets

### Key Insights

1. **Merge UX must be explicit and reversible — never silent.** Never auto-merge without agent confirmation. Show a side-by-side preview of all tickets involved, with highlighted differences (assignee, status, reply count, timestamps). Include an "Undo Merge" option for at least 30 minutes post-merge. Silent auto-merges destroy agent trust and make error recovery painful.

2. **Pre-merge confirmation dialog: show what you're about to lose.** Agents must see which replies, internal notes, attachments, and CCs each ticket carries before merging. A table comparing fields across tickets (Subject, Assignee, Status, Reply Count, Tags) makes the decision fast and grounded. If one ticket has an internal note the other lacks, surface it explicitly — don't bury it.

3. **Designate a primary/master ticket — preserve its ID and URL.** The merged result should retain the primary ticket's ID and thread history. This matters because customers already have email threads linked to ticket #4821 — that URL must not die. All linked emails and references point to the surviving ticket.

4. **Preserve CCs and followers from ALL tickets, not just the primary.** A common merge failure: CCs on the secondary ticket get silently dropped, leaving some stakeholders out of the loop. Merge must union all CCs and follower lists. Inform all participants via a notification that their tickets have been consolidated.

5. **AI-assisted duplicate detection is now table stakes, not a luxury.** Fuzzy matching on subject + requester email/company + time window (e.g., same customer within 24h) catches the obvious duplicates automatically and surfaces them as suggestions. Zoho Desk and Freshdesk both do this. Exact-match on email subject lines and requester identity catches resubmissions. Flag duplicates proactively — don't make agents hunt for them.

6. **Incident tickets have radically different duplication rates — handle them separately.** Incident-type tickets (same outage reported by many customers) can have 25–40% duplication. Billing tickets ~5–8%. Access/login issues ~10–15%. The merge/dedupe strategy should be configurable per ticket category — don't treat a billing dispute the same as a service outage.

7. **Post-merge, show a clear "merged from" breadcrumb on the surviving ticket.** Agents and customers viewing the thread should see: "This ticket was merged from #[orig-123] and #[orig-456]." This is both an audit trail and a trust signal — nobody thinks their issue was deleted. It also lets agents navigate to the original tickets if needed for historical context.

8. **Splitting (the reverse of merging) must preserve attribution and chronology.** Agents occasionally merge tickets prematurely or later discover they cover distinct issues. The split action must distribute replies and notes to the correct target tickets — not arbitrarily reassign everything to one. Preserve timestamps so the chronological order of events is preserved in each resulting ticket.

9. **Merge and split actions must appear in the ticket audit log, not just the thread.** The audit trail showing when tickets were merged, by whom, and into which ticket — this is critical for manager review, customer disputes ("I never submitted that!"), and reporting on dedupe effectiveness. Treat it as a first-class audit event, not a footnote.

10. **Duplicate detection should feed into a "Suggested Merge" inbox queue, not just a warning banner.** When the system identifies a likely duplicate, instead of blocking ticket creation entirely (which causes abandonment), add it to a "Review Duplicates" queue for agents to process during lower-traffic periods. Blocking creation outright drives customers crazy — flagging it for agent review is the right middle ground.

### How It Applies to Our CRM

- Build a "Review Duplicates" queue fed by fuzzy matching on subject + requester identity + time window. Flag potential duplicates without blocking ticket creation.
- On merge action: show a comparison table of all involved tickets (assignee, status, reply count, tags, CCs) and require explicit agent confirmation before merging.
- Preserve the primary ticket's ID and URL after merge. Union all CCs and followers across source tickets — never silently drop anyone.
- Add a visible "Merged from #[orig-xxx]" and "Split to #[new-xxx]" breadcrumb on the surviving tickets.
- Implement split with chronological distribution of replies/notes — preserve timestamps and ownership attribution.
- Log all merge/split events as first-class audit entries (actor, timestamp, source tickets, target ticket).
- Allow SLA policies to define per-category dedupe sensitivity (e.g., incident tickets get stricter detection thresholds than billing tickets).
- Make merge reversible for 30 minutes with an "Undo Merge" action that restores original ticket IDs and relationships.
