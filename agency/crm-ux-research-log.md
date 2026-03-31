# CRM UX Research Log

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
