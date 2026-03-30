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
