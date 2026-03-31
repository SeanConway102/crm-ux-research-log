# CRM UX Research Log

## Session 18 — 2026-03-31 11:30 UTC
**Topic:** SLA & Deadline Visualization UX for Ticketing CRMs

### Key Insights

1. **SLA timers should be impossible to ignore — but not disruptive.** Color-coded urgency (green → yellow → red as deadline approaches) is the baseline. The critical UX distinction is between *ambient urgency* (color bleeding into the ticket row, badge, or inbox count) and *interruptive urgency* (toasts, badges that bounce). Ambient works continuously; interruptions should only fire at breach threshold or when a human action is required. Never auto-escalate without warning the agent first.

2. **Show time remaining, not just the deadline timestamp.** "Due in 45 min" is actionable. "Due at 14:00" requires mental math the agent shouldn't have to do while triaging 20 tickets. The timer should count down in real-time and display in the ticket list view, ticket detail header, and agent dashboard — everywhere the agent looks. When <15 min remains, surface the exact minutes remaining prominently.

3. **SLA status must be visible without opening the ticket.** In queue views, each ticket row should display its SLA state: a color dot or pill badge (breached/at-risk/on-track), the time remaining, and the policy name. Agents triage by scanning rows — they cannot open every ticket. Zendesk, Freshdesk, and Jira Service Management all show SLA pills in list views for this reason. Hiding SLA behind a ticket detail screen is a major triage failure.

4. **"At-risk" is a UX state, not just a color.** At-risk tickets need more than red coloring — they need a clear escalation path visible in the same UI. A ticket that's 10 minutes from breaching should show not just a red timer but a suggested action: "Assign to Tier-2", "Escalate", or "Add note — SLA extension requested." This turns awareness into resolution momentum, not just anxiety.

5. **SLA pauses should be clearly communicated with reason and timestamp.** When does the SLA clock pause? (Customer reply pending, ticket on hold, awaiting external vendor.) The pause must be visually distinct from "running," show *why* it's paused, and show when it will resume. Agents lose trust in SLA UIs that freeze silently — it feels like a bug, not a feature. Show: "🟡 SLA paused — awaiting customer reply (paused 2h ago)."

6. **Breach notifications should be prioritized by impact, not sent uniformly.** Not all breaches are equal: a breached Tier-1 critical ticket needs immediate attention; a breached internal task ticket can wait. Batch breach alerts by severity tier and deliver them as a digest or escalation queue, not as individual noisy notifications that create alert fatigue. Manager dashboards should show breach counts by tier, not just a list of breached tickets.

7. **Business hours vs. calendar hours must be visually differentiated.** A ticket with a 4-hour SLA that pauses at 18:00 and resumes at 09:00 looks identical to one running continuously in naive UIs. Show "SLA: 4h (business hours)" and track remaining business-hours time separately. When a ticket is approaching breach within business hours, the urgency is real. When it's approaching after-hours, the UI should explain why the deadline is still safe.

8. **SLA performance analytics belong in the manager view, not just operational UIs.** Track: SLA hit rate by agent, by team, by ticket category, by time of day. Identify patterns — "Billing tickets always miss SLA on Mondays" is actionable intelligence. Show trends, not just snapshots. SLA dashboards should answer: "Are we improving?" and "Where are the bottlenecks?" with enough granularity to drive coaching decisions.

9. **First Response Time (FRT) and Resolution Time (RT) are distinct SLAs with distinct UIs.** FRT measures when the customer first hears from a human; RT measures when the ticket is closed. Confusing these creates agent confusion about priorities. Each should have its own visible timer and breach indicator in the ticket header. Many CRMs collapse these into one SLA — that's a mistake. Agents need to know: "Have I responded yet?" AND "Is this ticket on track to close within the resolution window?"

10. **SLA extensions should be a one-click, auditable action.** Agents need to be able to request an SLA extension without leaving the ticket context. A single "Extend SLA" button that opens a modal (new deadline, reason code: Customer-requested, Complex investigation, Third-party dependency) keeps the action in context and creates a structured audit log. Ad-hoc extension requests buried in notes fields are untrackable and create compliance gaps.

### How It Applies to Our CRM

- Add real-time countdown timers to ticket list rows, ticket detail headers, and dashboard widgets. Show "X min remaining" not just timestamps.
- Use a three-state SLA badge (🟢 On Track / 🟡 At Risk / 🔴 Breached) visible in every list view without opening the ticket.
- At-risk tickets (within 15 min of breach) should surface a suggested action button inline — "Escalate" or "Request Extension" — not just turn red.
- Display SLA pause state with icon + reason + pause duration. Never pause silently.
- Track and display FRT and RT as separate SLA types with separate timers. Agents should always know their current status on both.
- Show business-hours vs. calendar-hours SLA time separately when business hours are configured.
- Build a manager SLA dashboard: breach rate by tier/category/agent, trend over time, and actionable coaching flags.
- SLA extension should be a structured one-click modal with reason codes, creating an auditable log entry on the ticket.
- Build breach notification digests by severity tier rather than individual noisy alerts.
- When displaying SLA timers, include the policy name so agents know which rule is being applied (e.g., "Priority: Urgent – 1h FRT").

---

## Session 19 — 2026-03-31 13:30 UTC
**Topic:** Agent Workspace UX: Queue Views, Multi-Tasking & Focus Mode for High-Volume Ticketing

### Key Insights

1. **Split-pane layout (list + detail, no full-page navigation) is the productivity baseline.** Agents must see their queue and a ticket simultaneously. Every full-page navigation to open a ticket = context loss and cognitive load reset. The standard three-panel layout (queue list left, ticket thread center, customer context/actions right) keeps agents in flow. Full-page ticket views that hide the queue are a known anti-pattern in high-volume environments — Zendesk Agent Workspace, Front, and Freshdesk all converged on split-pane independently for this reason.

2. **Context switching is the #1 agent productivity killer — the UI must acknowledge it.** Agents handling 20+ tickets/day constantly switch between tickets, channels, and tasks. The workspace should display "working on X tickets" count prominently, allow agents to flag a ticket as "in progress" (locked to them, visible to others), and never auto-reassign a ticket while an agent has it open. Surprise reassignments during reply composition are catastrophic UX. A ticket's status should reflect its true state: Open / In Progress / Pending Customer / Resolved — not just the assignee name.

3. **Keyboard shortcuts are non-negotiable for power users — discoverability is the gap.** Agents who handle 40+ tickets/day will develop muscle memory. Required shortcuts: next ticket (J/→), previous ticket (K/←), resolve (R), add internal note (N), reply (E for edit/reply), change status (S). The UX failure is making shortcuts invisible. Zendesk solves this with a `?` help overlay showing all shortcuts. The shortcuts panel should be accessible from anywhere in the workspace without leaving current context. Power agents who discover shortcuts become dramatically faster; agents who never discover them plateau.

4. **"Focus mode" / ambient status prevents interruption overload during complex tickets.** When an agent is mid-draft on a sensitive or complex ticket, the queue should remain visible but notifications should mute. The agent manually exits focus mode when ready. This is different from Do Not Disturb (DND) — DND silences everything; focus mode silences only new ticket notifications while keeping breach alerts and @mentions alive. The distinction matters: an agent working a complex billing dispute doesn't need a new ticket popup, but a SLA breach on their queue is still their responsibility.

5. **Queue filters must persist across the session — not reset on every ticket open.** If an agent filters to "Priority: Urgent + Status: Open + Assignee: Me" and opens a ticket, the filter should survive when they return to the queue. Many CRMs silently reset filters on navigation, forcing agents to re-apply filters constantly — this is a major friction source. Filters should be URL-addressable and bookmarkable so agents can share specific queue views by link.

6. **Queue tabs for multi-channel agents reduce channel-switching cognitive load.** An agent handling email + chat + phone benefits from separate queue tabs per channel. Switching channels mid-ticket is a known error cause — context from an email thread bleeds into a chat response. Channel-separated tabs (or a unified queue with prominent channel icon per ticket) let agents batch-process by channel when appropriate. At minimum, each ticket row should display its source channel icon prominently in the list view.

7. **Bulk actions must feel safe — require confirmation and show exactly what will change.** Bulk-resolve, bulk-assign, bulk-tag operations affect dozens of tickets at once. The confirmation dialog must list: how many tickets are affected, what the action will do (e.g., "assign all 12 to Tier-2 queue"), and what cannot be undone. A "select all visible" vs "select all matching filter" distinction prevents accidental mass actions. Slack-style undo toast (5-second window) after bulk actions is a strong safety net that agents trust.

8. **Empty queue states are missed UX opportunities — guide the next action.** "Your queue is empty" should never be a dead-end screen. It should show: tickets pending customer reply (awaiting response), recently resolved tickets, team queue health summary, or a prompt for follow-up actions. This transforms idle time into productive ones — agents can proactively reach out to customers waiting too long for a response rather than sitting idle or closing the CRM.

9. **Real-time presence indicators reduce collision and duplicate work.** Who else is viewing or has this ticket open? Multi-agent environments create silent collisions: two agents work the same ticket, both reply, the customer gets a confusing duplicate response. Show other agents' avatars in the ticket header if they're currently viewing it. Some CRMs go further: lock the ticket to the first agent who clicks into it (with an override option for supervisors) — this is controversial but reduces collision significantly in very high-volume environments.

10. **Agent queue health widgets should surface actionable summary, not raw numbers.** A dashboard showing "You have 47 open tickets" is anxiety-inducing but not actionable. A better summary: "3 urgent/at-risk, 12 awaiting your reply, 8 awaiting customer" — each bucket is a different workflow with a different next action. This turns a number into a prioritized task list. The goal is for agents to look at the queue summary and immediately know what to do next without mental triage.

### How It Applies to Our CRM

- Implement a persistent split-pane layout: queue list (left, ~30% width) + ticket detail (center) + customer context panel (right, collapsible). Never use full-page ticket navigation as the default.
- Build a persistent ticket status system: Open / In Progress / Pending / Resolved, visible in queue rows. Status must be URL-addressable and filterable.
- Implement keyboard shortcuts for all frequent actions (next/prev, resolve, note, reply, status change) with a `?` overlay accessible from anywhere.
- Add a Focus Mode toggle — mutes new ticket notifications but preserves SLA breach alerts and @mentions. Differentiate from system DND.
- Ensure queue filters persist across ticket opens and across the session. Filters should be bookmarkable/shareable by URL.
- Display source channel icon per ticket row. Consider channel-separated queue tabs for multi-channel agents.
- For bulk actions: require confirmation listing exact count + change, with an undo toast (5s window). Distinguish "select all visible" from "select all matching filter."
- Replace empty queue screen with an actionable state: show tickets awaiting customer reply, team summary, or proactive follow-up prompts.
- Add real-time presence indicators: show other agents viewing the same ticket. Consider soft-lock on ticket open (with supervisor override).
- Replace "X open tickets" with categorized buckets: "3 urgent, 12 awaiting your reply, 8 awaiting customer" — each linked to the filtered queue view.

---

## Session 17 — 2026-03-31 10:30 UTC
**Topic:** Ticket Templates, Structured Forms & Macros UX for Ticketing CRMs

### Key Insights

1. **Templates are most valuable when they structure the thinking, not just fill the text.** A template that pre-populates a reply with "Hello {{customer_name}}, I'm looking into your issue" is a convenience. A template that guides the agent through a structured diagnostic workflow (greeting → acknowledgement → required checks → resolution steps → follow-up) is a quality tool. The difference is enormous: convenience templates save keystrokes; structured templates prevent missed steps and ensure consistent resolution quality.

2. **Template selection should be frictionless — search and browse, not deep menus.** Agents under load won't hunt through a 40-item folder hierarchy for the right template. A `/`-triggered command palette with fuzzy search ("refund" → "Refund – Standard", "Refund – Chargeback", "Refund – Promo") lets agents find and insert a template in under 2 seconds. HubSpot, Zendesk, and Intercom all converge on slash-command palette UX for this exact reason.

3. **Variable placeholders must be obvious and auto-populated.** `{{customer_name}}`, `{{ticket_id}}`, `{{agent_name}}`, `{{sla_deadline}}` — placeholders that are visually distinct (e.g., highlighted in amber or wrapped in `{{ }}`) prevent agents from accidentally sending a template with unfilled variables. Auto-populate everything the system knows at insertion time. Any unfilled variable after insertion should be highlighted red with a tooltip: "Replace before sending."

4. **Templates must be scoped and contextual, not one global library.** A "Billing Refund" template is useless for a Tier-1 agent who can't process refunds — but it's essential for a billing specialist. Template libraries should be filtered by agent role, current ticket category, and ticket status. Showing every template to every agent creates decision paralysis and mis-applied templates. Permission-scoped templates are a non-negotiable for orgs with tiered support structures.

5. **Macros that combine action + reply text outperform text-only macros.** A macro called "Escalate to Tier-2" should simultaneously: change ticket status to "Escalated," assign to the Tier-2 queue, add an internal note with the escalation reason, AND insert a customer-facing reply — not just one of these. Agents doing repetitive workflows should trigger a single macro and have all necessary state changes fire together. This is the single biggest efficiency multiplier in high-volume ticket environments.

6. **Template and macro editing must have live preview — not a save-then-test loop.** When editing a template, agents need to see it rendered exactly as it will appear in the ticket (with current variable values or placeholders shown). A side-by-side editor+preview pane prevents badly formatted macros from going live. Many CRMs collapse this to a plain text editor — agents discover formatting breaks only after customers receive broken replies.

7. **Template analytics should measure adoption AND accuracy.** Track: how often each template/macro is used, by whom, and whether tickets using that template have different outcome metrics (CSAT, resolution time, escalation rate) than tickets where agents wrote freely. A high-use, low-CSAT template is worse than no template — it's systematically degrading experience at scale. Make template performance a visible metric for template authors and team managers.

8. **Version history on templates prevents catastrophic regressions.** When a team lead updates a popular template and accidentally removes the greeting, every agent using it sends broken replies until caught. Template version history (who changed what, when, with a one-click rollback) is a low-effort feature that prevents high-visibility failures. Zendesk and Front both support template versioning — it's table stakes for orgs with >5 agents.

9. **Dynamic conditional content in templates > static templates.** "If {{customer_plan}} = Enterprise → show premium support SLA text; else → show standard text" seems complex but is the difference between a template that feels bespoke and one that feels like a form letter. Even simple conditionals (greeting that adapts to time of day: "Good morning/afternoon/evening") significantly increase the personal feel of templated replies.

10. **Template authoring requires a role-based approval workflow in regulated industries.** In banking, healthcare, or legal support, a template is effectively a customer-facing communication that may need sign-off before use. CRM template workflows should support a "Draft → Pending Review → Approved → Live" lifecycle, with notifications to reviewers when templates are submitted. Unapproved templates should be usable only in sandbox/training mode — not on live tickets.

### How It Applies to Our CRM

- Implement a `/`-command palette for template/macro search and insertion — fuzzy match, scoped by agent role and current ticket category.
- Distinguish clearly between "Convenience templates" (pre-written reply text) and "Workflow macros" (action + reply combos). Make both discoverable in the same palette.
- Use visually distinct placeholder syntax (`{{variable}}`) and highlight unfilled or unfillable variables in red before sending.
- Scope template visibility by agent role, ticket category, and team. Never show all templates to all agents.
- Build macro actions that fire multiple state changes in one trigger: status + assignee + tag + reply text, not just one.
- Add a live split-pane preview in the template editor (template left, rendered output right).
- Track per-template outcomes: CSAT, resolution time, escalation rate. Surface low-performing templates to template authors with a prompt to revise.
- Implement version history on templates with one-click rollback.
- Add conditional content support (if/else based on customer plan, ticket category, time) in the template editor.
- For regulated environments, add a Draft → Review → Approved → Live workflow with reviewer notifications. Unapproved templates restricted to sandbox.
