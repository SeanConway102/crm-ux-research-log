# CRM UX Research Log

## Session 49 — 2026-04-01 17:30 UTC
**Topic:** Mobile CRM Agent Experience UX for Ticketing Systems

### Key Insights

1. **Mobile CRM is not a shrunk desktop — it serves a fundamentally different agent context.** Desktop CRM is used by agents seated at a workstation, focused for extended periods. Mobile CRM is used by field agents, traveling staff, or desktop agents during commutes and after-hours. The mobile context introduces: interrupted attention, one-handed operation, small touch targets, ambient lighting variability, and slower/inconsistent connectivity. Designing mobile CRM as a responsive-shrunk desktop produces an app agents hate. Mobile CRM needs its own information hierarchy and task flow — not a layout reflow.

2. **Touch targets must be 44x44px minimum — everything smaller creates error-prone taps and frustration.** The 44x44px (iOS) / 48dp (Android) touch target is a baseline, not a maximum. Ticket action buttons (Reply, Assign, Status Change), navigation elements, and checkbox targets on mobile CRM must meet this threshold. Queue list rows that require tapping a checkbox then tapping an action button — both within a narrow row — are a two-hand operation on mobile. Use full-width swipe actions or bottom-anchored action bars instead. Zendesk's mobile app uses bottom tab bars and swipe-to-reveal actions — this is the correct mobile pattern for CRMs.

3. **Swipe gestures are the mobile CRM's power-user feature — invest in them.** Desktop has keyboard shortcuts; mobile has swipes. Swipe right on a ticket row to mark it as read and dismiss it. Swipe left to reveal quick actions (Assign, Change Status, Escalate). Long-press to open a context menu. These gestures must: have no alternative that requires more taps (if a gesture is the only way to do something, it's inaccessible), feel physically responsive (provide haptic feedback on action trigger), and animate smoothly (100-150ms). Linear's mobile app and Superhuman's mobile gestures are reference implementations. A mobile CRM without swipe gestures forces agents to perform 3-4 taps where one swipe would do.

4. **The mobile queue view must prioritize ruthlessly — agents see 3-5 rows at a time, not 20.** On a 375px wide screen, a ticket queue that shows 10 rows of compact data produces unreadable text. The mobile queue should show: ticket subject (truncated to 1 line), SLA urgency badge (color-coded), customer name, and time since last update. That's it. Every additional column on mobile is noise that costs readability. Agents who need more detail open the ticket. The queue is for triage, not assessment — mobile agents should be able to scan 20 tickets in 10 seconds without squinting.

5. **Offline capability is non-negotiable for field agents — tickets must be accessible without connectivity.** A field agent inspecting a customer site with intermittent WiFi cannot lose access to their ticket queue. The CRM mobile app must: cache the current day's assigned tickets and recent queue for offline access, queue outbound actions (status changes, notes, replies) for sync when connectivity returns, and clearly surface offline state ("You're offline — changes will sync when connected"). Every action taken offline must be timestamped locally and reconciled on sync without data loss. ServiceNow's mobile app implements this with a visible "pending sync" badge and explicit offline mode indicator.

6. **Push notifications on mobile must be actionable — "you have a new ticket" is not enough.** An agent receiving a push notification for a new SLA-breaching ticket should be able to: tap the notification and open directly to that ticket, take a quick action (assign to self, mark acknowledged) from the notification itself, and dismiss or snooze the notification. Notification tap should deep-link to the specific ticket, not the app's home screen. Zendesk's mobile push notifications include ticket subject and customer name in the notification body — agents can triage from the lock screen without opening the app. Generic "New notification from CRM" notifications create notification fatigue and wasted tap-throughs.

7. **Reply composition on mobile must be frictionless — the keyboard should never obscure the composer.** Mobile CRM reply composers frequently fail: the keyboard slides up and covers the send button, the canned response picker requires scrolling past the keyboard, or the attachment button is inaccessible behind the keyboard. The correct pattern: the composer toolbar (send, attach, canned responses) sits above the keyboard when it appears, the text area reflows to remain fully visible above the toolbar, and a "shrink composer" toggle lets agents see the thread while typing. Apple's keyboard handling guidelines and Zendesk's mobile composer are reference implementations.

8. **Camera and photo integration for field evidence collection is a high-value mobile CRM feature.** Field service agents handling on-site issues need to: photograph equipment, capture signatures on mobile, scan barcodes/QR codes for asset lookup, and attach photos directly to tickets without a round-trip through email. The CRM's mobile composer should support: camera capture as a first-class attachment type, photo annotation (circle a problem area, draw an arrow), and GPS tagging on attachments (automatically record where the photo was taken). This transforms the CRM from a communication tool into a field data capture tool. Salesforce Field Service and ServiceNow's mobile apps both implement photo annotation and GPS tagging natively.

9. **Mobile dashboards require a completely different metric hierarchy — at-a-glance, not scrollable.** A desktop dashboard with 8 metric cards is readable. The same 8 cards on a mobile screen require vertical scrolling that destroys at-a-glance comprehension. Mobile agent dashboards should show: current ticket status (my open count), SLA urgency (how many tickets at risk right now), and personal CSAT trend (up/down arrow with one number). That's 3 metrics, not 8. Manager mobile dashboards should show: team queue depth (one number), SLA compliance percentage, and a priority flag list (which agents or tickets need immediate attention). Charts and trend lines belong on desktop — mobile dashboards are for exception reporting.

10. **Session timeout and re-authentication on mobile must balance security with agent workflow.** Field agents may check a ticket while walking to a customer site, put the phone in their pocket, and return 8 minutes later. A 5-minute session timeout forces re-login, which is frustrating. A 4-hour session is a security risk. The right pattern: 15-minute active timeout (if the app is in the foreground and the agent is interacting), extended session while the app is backgrounded (up to 4 hours), biometric re-authentication (Face ID / fingerprint) for app re-entry after background timeout, and explicit "stay logged in" toggle for trusted devices. Never force a full password re-entry on mobile — biometric auth lowers friction enough to keep agents using the app rather than workarounds.

### How It Applies to Our CRM

- Design mobile CRM as a purpose-built interface, not a responsive reflow of desktop. Mobile serves field agents and after-hours triage — different context, different hierarchy.
- Enforce 44x44px minimum touch targets on all mobile interactive elements. Queue rows and action buttons must be full-width tap targets, not small checkboxes.
- Implement swipe gestures: swipe right to mark-read/dismiss, swipe left to reveal quick actions (assign, status, escalate), long-press for context menu. Provide haptic feedback on gesture triggers.
- Ruthlessly prioritize mobile queue columns: subject (1-line truncate), SLA badge (color), customer name, time since last update. No additional columns — agents open tickets for detail.
- Build offline-first architecture: cache today's tickets locally, queue outbound actions with local timestamps, show "offline" indicator and "pending sync" badge. Sync without data loss on reconnect.
- Make push notifications deep-linkable to specific tickets with actionable content (ticket subject, customer name, SLA urgency). Support quick actions (assign to self, acknowledge) from notification itself.
- Fix mobile composer: toolbar above keyboard, text area reflows above toolbar, shrink/toggle button to see thread while composing. Test with one-handed use on iPhone SE size.
- Add camera integration for field evidence: photo capture, annotation (draw/circle), GPS tagging on attachments, signature capture. Attach directly to tickets without email round-trip.
- Rebuild mobile dashboards for mobile context: 3 metrics max (status count, SLA at-risk count, CSAT trend). Manager mobile view: team queue depth, SLA %, priority flags. No charts on mobile.
- Implement biometric re-authentication (Face ID / fingerprint) for app re-entry after background timeout. 15-minute active session, 4-hour background session. "Stay logged in" toggle for trusted devices.
- Test mobile CRM on real field conditions: slow 3G, interrupted connectivity, one-handed operation, outdoor brightness. Lab testing misses the actual failure modes.
- Consider a "field mode" toggle that simplifies the mobile UI further: larger text, bigger touch targets, minimal features, optimized for outdoor and one-handed use.
- Track mobile vs. desktop ticket resolution rates and times. If mobile agents are taking significantly longer to resolve tickets, the mobile UX is the bottleneck — investigate and fix.

---

## Session 51 — 2026-04-01 19:30 UTC
**Topic:** Search & Filtering UX for Ticket Queues

### Key Insights

1. **Filters are a discovery layer, not just a search tool — they teach agents what the system knows.** When filters surface values that aren't visible in the queue itself (e.g., filtering by "tags" shows agents that tagging exists as a data field), they serve a double purpose: narrowing results AND educating agents about available data properties. Every filterable field should mirror a visible data column in the queue. If "Last Updated" appears on ticket rows but can't be filtered, agents notice the gap — it feels incomplete.

2. **Filter positioning follows data scope: sidebar for global queue filters, inline for contextual needs.** For a standard ticket queue, a left-hand sidebar filter panel scales well — it holds many filter options in expandable sections without consuming content space. A horizontal filter bar above the queue works for smaller, more focused filter sets. Inline filters (filters embedded within a specific component) are right for mixed-data dashboards where different widgets need different filter scopes. For a CRM ticket queue, a collapsible sidebar with grouped filters is the correct default — Zendesk and Intercom both use this.

3. **Live filtering (instant results as you type) beats apply-button filtering for queues under ~500 items.** When fetch latency is under 300ms, live filtering feels instantaneous and keeps agents in flow. When latency is higher or the dataset is large, use an "Apply" button to batch filter changes before executing. The failure mode of apply-button filtering: agents don't realize they need to click Apply, wonder why their results haven't changed, and blame the system. For a CRM where agents may have 50-200 open tickets, live filtering is the right default.

4. **Sort and filter are not the same — sort order is a separate control that deserves its own prominence.** Sort (ordering) and filter (narrowing) are often conflated in CRM implementations. Agents need a clear, always-visible sort control separate from filters: "Sort by: Newest / Oldest / SLA Urgency / Last Updated / Priority." The default sort should be SLA urgency descending — agents should always see the most time-sensitive tickets first. If sort defaults to alphabetical or newest-first, it actively works against efficient triage.

5. **Checkbox multi-select filters work for tags, agents, channels, and statuses — but only with visible counts.** Every checkbox filter option should show the number of matching tickets in real-time: "Open (42) | Pending (7) | Resolved (103)." Without counts, agents guess whether a filter will actually narrow anything. With counts, they can make an informed decision in one glance. Range filters (e.g., SLA time remaining: "Under 1hr / 1-4hrs / 4-8hrs / Over 8hrs") are better than checkboxes for time-based filters because they match how agents actually think about urgency.

6. **Saved and shareable filter views are a high-value feature that teams consistently undervalue.** Agents and teams have recurring filter needs: "All open tickets assigned to me from enterprise customers" or "All unresolved tickets older than 48hrs." These should be saveable as named views (like Gmail filters). Bonus: saved filter URLs should be shareable via a link — managers can send a filtered view to a team without explaining what to click. This turns the CRM queue into a collaborative triage tool rather than an individual one.

7. **Smart defaults eliminate setup friction — the first queue view should require zero configuration.** New agents should see a sane default queue: "My tickets, sorted by SLA urgency, all statuses." Power users should be able to override these defaults and persist their preferences. When an agent opens the queue and sees 5,000 tickets with no filters pre-applied, it communicates "we haven't thought about your workflow" — it's immediately overwhelming. The queue should feel like it was built for them, not generically for everyone.

8. **Filters must show their active state clearly — inactive filters look the same as irrelevant ones.** When multiple filters are active, the queue view must: show a "X filters active" summary with a quick-clear option, highlight active filter chips above the results (e.g., "Status: Open × | Priority: High × | Assignee: Me ×"), and distinguish between a filter that's set to "all values" (inactive) vs. a specific value (active). Visual ambiguity between "all" and "none selected" is the #1 source of agent confusion in filter UIs.

9. **Full-text search in a ticket queue must handle partial, typo-tolerant queries against ticket subject, customer name, and ticket ID.** Agents search differently on a CRM than on Google: they search ticket IDs ("#10432"), customer names they've seen before, and specific words in subjects. The search bar must be: accessible with Cmd/Ctrl+K as a global shortcut, tolerant of partial matches (typing "inv" finds "Invoice", "Investigate", "Inventory"), and scoped to the current queue by default (not global search). Search and filters must work together — applying filters should not clear the search query.

10. **The "clear all filters" action must be one click and visually obvious — never buried or require a page reload.** Every filter interaction needs an escape hatch. The clear-all button should: appear whenever any filter is active, sit in the filter bar itself (not require scrolling), and execute instantly (no confirmation dialog needed). This is a safety/ recoverability principle — agents should never feel trapped by a filter state they can't easily undo. A reset-to-default button is equally important for power users who want to return to the baseline view quickly.

### How It Applies to Our CRM

- Mirror every visible queue column as a filter option. If "Last Updated" is a column, it must be filterable. Every gap between visible data and filterable data erodes agent trust.
- Use a collapsible left sidebar for queue filters. Keep a horizontal sort control (SLA urgency / Newest / Last Updated) always visible above the queue — don't bury sort in the filter panel.
- Implement live filtering with instant results for queues under 200 tickets. If latency exceeds 300ms, fall back to an "Apply" button — but signal this clearly so agents don't think it's broken.
- Default sort to SLA urgency descending (most urgent first). Never default to alphabetical or newest-first — those sort orders actively harm triage efficiency.
- Add real-time counts to every checkbox filter option. Agents deciding whether to filter by "Open" need to know there are 42 open tickets — otherwise they're guessing.
- Use range filters for SLA time windows (Under 1hr / 1-4hrs / 4-8hrs / Over 8hrs) rather than checkboxes — agents triage by time buckets, not by individual SLA values.
- Build saveable named filter views (e.g., "My Urgent Queue", "Enterprise Customers — All Statuses"). Make saved views shareable via URL.
- Set smart defaults per agent role: new agents see "My Tickets / Open / SLA Urgency sort." Managers see "All Team Tickets / All Statuses / SLA Urgency sort."
- Show active filter chips above results whenever any filter is active. Each chip has an × to remove that specific filter. Add a single "Clear all" button in the filter bar.
- Implement Cmd/Ctrl+K global search in the queue. Support partial and typo-tolerant matching on ticket subject, customer name, and ticket ID. Search and filters must be composable without mutual interference.
- Add a "Reset to defaults" button that's always visible when non-default filters are active. One click to return to the baseline view — no page reload required.
- Track filter usage analytics: which filters are used most? Which filters are set but rarely changed? This tells you which filters agents actually need vs. which ones are clutter.
- Consider an "agent speed" metric: average time from queue open to first ticket action. Good filter/sort defaults should keep this under 5 seconds for an experienced agent.

---

## Session 50 — 2026-04-01 18:43 UTC
**Topic:** Omnichannel Inbox UX for Ticketing CRMs — Agent Workspace Design

### Key Insights

1. **The inbox is the agent's primary workspace — every pixel must earn its place.** Agents spend 80%+ of their time in the inbox view. A ticket queue row should show, in order of scan priority: SLA urgency badge (color-coded), ticket subject (1-line truncated), customer name, channel icon (email/chat/phone/social), time since last update, and assignee avatar (for team queues). Every additional column is noise that slows triage. The queue must be scannable at a glance — agents should be able to process 20 rows in 10 seconds without reading full text.

2. **Channel switching must not break ticket context — unify the thread, not the layout.** Agents move between email, chat, phone, and social channels constantly. The correct UX pattern: channel source is metadata on a unified conversation thread, not a separate workspace or tab. Opening "email tickets" vs "chat tickets" in separate views forces context loss and reorientation. Intercom and Zendesk both keep the conversation central — channel is one field, not a workspace switch. Agents should be able to handle all channels from one inbox without clicking through tabs.

3. **Keyboard shortcuts are non-negotiable for agent velocity — implement Gmail/Superhuman-level coverage.** Power agents using shortcuts resolve tickets 3-4x faster than mouse-only users. Essential shortcut set: J/K to navigate queue rows, O or Enter to open a ticket, R to open reply, U to open status/assignee update, Cmd+Enter to send, Tab to advance to next field, Esc to collapse back. Shortcuts must be: discoverable (shown in tooltips and as greyed-out labels on buttons), rebindable (agents have preferences), and documented in a floating shortcut reference panel. Shortcuts that aren't discoverable are shortcuts that go unused.

4. **The split-pane inbox (queue list + thread) is the proven dominant layout — don't reinvent it.** The three-column or tabbed inbox pattern (queues | tickets | preview) slows agents down because preview panes require constant head movement. The correct layout: collapsible left sidebar (queues, filters, folders), center column (ticket queue list), right column (active ticket thread). Agents need to see the queue while reading a ticket simultaneously. Adding a preview pane between queue and thread adds a navigation step without benefit. Zendesk Agent Workspace, Intercom, and Superhuman all converged on this layout independently.

5. **Preserve agent context across ticket navigation — never lose their place.** When an agent opens ticket A, reads it, clicks to ticket B, then navigates back — they must return to exactly where they were. This means: restore scroll position in the queue, restore the last-selected ticket, restore thread scroll position in the conversation. Context loss on back-navigation is the single most-frequent agent complaint in ticketing systems. Each "back" navigation should feel instantaneous and stateful. Test this with agents daily — if they hesitate before acting, they've lost context.

6. **Smart queue sorting with visual urgency signals reduces SLA breaches more than any other feature.** Color-coded SLA countdown badges ("Breaches in 12m", "SLA OK") let agents make instant prioritization decisions without opening a ticket. The queue should auto-sort by SLA urgency descending by default. Visual warnings (row background tint, pulsing badge) for tickets approaching breach are more actionable than a number in a stats panel. Red/amber/green urgency coding should be consistent everywhere: queue rows, ticket header, and dashboard widgets.

7. **Bulk actions with multi-select enable efficient queue management at scale.** When managing a queue of 50-200 tickets, agents need to assign, tag, change status, or merge tickets without opening each one. The Gmail pattern works: checkbox on each row, floating action bar appears on selection ("3 selected — Assign, Tag, Close"), and actions apply to all checked items atomically. Without bulk actions, queue management becomes a 10-click-per-ticket chore that agents avoid, leading to queue buildup.

8. **Real-time presence and ticket locking prevent duplicate work on team queues.** Agents need to see: who's online, which queue they're active in, and whether another agent is currently viewing the same ticket ("Sarah is viewing" indicator). Without ticket locking, two agents can independently work the same ticket — resulting in conflicting replies, duplicate work, and customer confusion. Locking should be soft (advisory) with a visible indicator, not hard exclusive locks (which frustrate agents who need to take over). The pattern: "Agent X is viewing" → auto-lock after 60s of inactivity → lock releases when agent navigates away.

### How It Applies to Our CRM

- Implement the split-pane layout: left sidebar (queues/filters), center (ticket list), right (thread). Do not add a preview pane between list and thread. This is the single highest-impact layout change.
- Build a comprehensive keyboard shortcut system: J/K navigation, R for reply, U for update, Cmd+Enter to send, Esc to collapse. Show shortcuts in tooltips. Add a "?" shortcut panel showing all shortcuts. Make them rebindable via settings.
- Preserve scroll position and selection state across every navigation action. This is a quality-of-life fix that agents notice immediately — test it weekly.
- Auto-sort queue by SLA urgency (most urgent first). Add color-coded SLA badges to every queue row. Show "Breaches in X min" countdown for at-risk tickets.
- Implement channel icons on queue rows and unify channel handling into one inbox view — not separate tabs for email vs. chat.
- Add multi-select checkboxes with floating bulk action bar: assign, tag, change status. This reduces queue management time dramatically.
- Add "Agent X is viewing" presence indicators on team queues. Implement soft locking after 60s of inactivity on a ticket.
- Track queue context: how often do agents open the same ticket twice in a session? High repeat-open rates indicate context loss. Target < 10% repeat-open rate.
- The inbox should feel like a professional power tool. Agents should feel in control, not overwhelmed. Reduce visual clutter ruthlessly — if it doesn't help triage, it doesn't belong in the queue view.

---

## Session 52 — 2026-04-01 20:41 UTC
**Topic:** SLA & Urgency Visual Design for Ticketing CRMs

### Key Insights

1. **SLA urgency is the primary triage signal — it must be instantly readable at every interaction point.** Every surface the agent touches (queue row, ticket header, reply composer, dashboard widget) must display SLA urgency using a consistent color + text code. Red/amber/green is the universal standard: red = breached or <15min remaining, amber = 15-60min remaining, green = healthy. Inconsistency between surfaces (e.g., green in the queue but red in the ticket header) destroys trust in the indicator — agents stop relying on it.

2. **Countdown timers belong in ticket headers — not in the queue.** Queue rows show color badges (red/amber/green) for fast scanning across 20+ tickets. The ticket header shows the actual countdown timer ("Breaches in 47m", "Breached 12m ago") because the agent has already committed to working that ticket. Sprinklr's pattern: a countdown timer appears in the ticket header once the breach-start threshold is reached (e.g., 75% of SLA time consumed), not from ticket creation. This prevents countdown noise on tickets that are well within SLA.

3. **Progressive urgency escalation uses color + motion, not just color.** A ticket at 99% of SLA time is visually identical to one at 80% if both use the same amber. Progressive escalation patterns: at breach-start threshold (e.g., 75%), change from green to amber; at 90%, pulse the badge or add a subtle row highlight; at 100% (breach), turn red with a steady pulse or left-border stripe. Motion should communicate "this is getting worse" — not just "this is urgent." Intercom uses a pulsing red indicator for breached tickets.

4. **SLA pause states must be visually explicit — agents need to know when the clock stops.** When a ticket is pending customer response, the SLA timer is paused but most UIs hide this. The correct pattern: show a "SLA paused" label with a pause icon next to the countdown timer, and keep the elapsed time visible so agents know the total wait time. Never let agents discover a pause state by accident — it should be announced the moment it activates. Without pause visibility, agents panic about breaches that aren't actually counting down.

5. **Breach-start vs. breach threshold is a two-stage alert system, not one.** Stage 1 (breach-start, e.g., 75% of SLA time): amber badge appears, agent should prioritize but isn't in crisis. Stage 2 (100% / breach): red badge, countdown timer visible, escalation path triggered. Most CRMs conflate these into one alert, which causes either alert fatigue (if both trigger at 100%) or late awareness (if no early warning exists). Two clear stages give agents time to act before a breach rather than just after.

6. **Different SLA policies must show their own urgency thresholds — don't normalize across all tickets.** A 1-hour enterprise SLA ticket and a 24-hour standard ticket both at 50 minutes look very different in urgency. The CRM should display: the specific SLA policy name (e.g., "Enterprise — 1hr Response"), the time remaining against that specific policy, and a visual indicator of where that ticket sits within its own SLA window. Agents triaging across mixed SLA tiers need this context to make correct prioritization decisions — a 22-minute-old enterprise ticket is more urgent than a 22-hour-old standard ticket.

7. **Personal urgency thresholds let agents self-configure their alert sensitivity.** One agent may want a warning at 50% of SLA time; another wants it at 80%. Per-agent SLA alert customization (in settings: "warn me at X% of SLA") reduces alert fatigue and lets agents tune the system to their workflow. Manager-level alerts should use stricter thresholds (e.g., 60% warning, 80% escalation) because managers oversee more tickets. This two-tier threshold system — personal and managerial — is more actionable than a one-size system.

8. **Overdue (breached) tickets need a distinct display format from time-remaining tickets.** A ticket breached 3 hours ago should show "+3h 12m overdue" (the plus sign signals overdue state) rather than a negative countdown. Never show "-3h 12m" — negative numbers in an urgency context are confusing and require cognitive parsing. The overdue label should also persist the original SLA target: "+3h 12m overdue (was: 1hr response)". This gives agents historical context without requiring them to look up the original SLA policy.

9. **SLA indicators must be embedded in the reply composer — agents should never lose urgency context while typing.** When an agent opens a reply, the SLA countdown should remain visible at the top of the composer. This is where agents spend the most time per-ticket. If the SLA indicator disappears during composition, agents lose their sense of urgency and may draft a slow, thorough reply when a quick acknowledgment was all the customer needed. Sprinklr's SLA indicator persists in the composer toolbar — this is the correct pattern.

10. **Escalation path indicators show the chain of custody when SLAs breach.** When a ticket breaches, which manager gets notified? Has it been escalated? An escalation badge on the queue row ("Escalated to Sarah") tells the current agent that someone else is now managing this ticket — reducing duplicate work and anxiety about unowned breaches. Without this, breached tickets create confusion about accountability: is this mine to fix, or did someone else pick it up?

### How It Applies to Our CRM

- Standardize the color system everywhere SLA appears: queue rows, ticket header, composer toolbar, dashboard widgets. Red = breached or <15min, Amber = 15-60min, Green = healthy. Document it and enforce it — inconsistency is worse than any single imperfect choice.
- Implement two-stage SLA alerts: breach-start at ~75% of SLA window (amber, warning) and breach at 100% (red, countdown timer visible). Don't conflate them.
- Show countdown timers in ticket headers only (not queue rows). Queue rows get color badges. Composer gets a persistent SLA badge in the toolbar.
- Add explicit "SLA paused" state with a pause icon and visible elapsed time whenever the SLA clock isn't running. Never hide pause states.
- Display per-ticket SLA policy name alongside the countdown. Agents working mixed queues need to know which SLA tier applies to each ticket.
- Add per-agent SLA warning threshold settings ("warn me at X% of SLA"). Manager settings use stricter defaults (60%/80%).
- Use "+3h overdue" format (not "-3h") for breached tickets. Always show the original SLA target alongside the overdue duration.
- Implement escalation chain indicators on breached tickets: "Escalated to [Manager Name]" badge on queue rows. Eliminates confusion about ticket ownership after breach.
- Track SLA-related metrics: what % of tickets breach at each stage (warning vs. breach)? This tells you whether your warning threshold is too early (noise) or too late (missed breaches).
- Test the SLA urgency system with agents under simulated time pressure. If agents can't instantly tell which of their 5 open tickets to work first, the urgency system needs refinement.
- Consider SLA trend indicators: "Improving" (ticket going toward resolution with time to spare) vs. "At Risk" (ticket consuming SLA faster than expected) — helps agents anticipate problems before they breach.

---

## Session 53 — 2026-04-01 21:30 UTC
**Topic:** Ticket Thread & Conversation UI — Internal Notes vs. Public Replies

### Key Insights

1. **The internal note / public reply divide is the most critical UX boundary in a ticketing CRM — it must be impossible to accidentally send an internal note to a customer.** The two-mode composer (note vs. reply) is the highest-stakes UI element in the entire CRM. The wrong design: a tiny dropdown selector buried in a toolbar that agents can change without realizing. The correct design: two entirely separate composer modes with different prominent buttons ("Send Reply" vs. "Add Internal Note"), distinct visual treatment (reply = blue/green CTA, note = orange/yellow warning tone), and a confirmation dialog on first use of each mode per session. Accidentally sending an internal note to a customer is a data breach and a trust violation — design for zero accidents.

2. **Internal notes must be visually unambiguous in the thread —一眼就能分辨.** Once a note is sent, it must be instantly recognizable at a glance. The correct pattern: a distinct background color (soft orange/yellow tint), a lock or note icon, bold "Internal" label, and no customer-visible information. The note should occupy the same space in the thread as customer messages — not be relegated to a sidebar tab. Notes in a sidebar tab are notes the agent forgets exist. Intercom uses a yellow-tinted bubble with a "Private" label — this pattern works. Notes must never be visually competitive with customer messages for the agent's attention.

3. **The thread must distinguish agent, customer, and system messages with clear visual hierarchy.** Customer messages: clean, left-aligned, standard bubble. Agent replies: right-aligned or visually distinct (different background), with agent name visible. Internal notes: visually set apart (yellow tint, lock icon, "Internal" label). System events (status changes, SLA pauses, assignments): italicized, muted gray, timestamped — clearly not conversational content. Agents should never mistake a system event for a customer message or vice versa. Visual parity between agent and customer bubbles is fine; system events must be clearly subordinate.

4. **Thread collapsing and summarization prevents agents from drowning in long conversations.** A ticket with 47 replies is unreadable when opened fresh. The thread should: show the first and last N messages by default with a "Show full thread (47 messages)" expansion, collapse messages from the same sender in quick succession (e.g., 3 agent replies in a row = one expanded block), and show a "Summary of N earlier messages" option that condenses the middle of a thread into a one-line summary. Long threads must scroll to the most recent message on open. Intercom's "show less" and "show more" on message groups is the reference implementation.

5. **Quote-reply (referencing specific messages) dramatically improves context in ticket threads.** When a customer writes "as we discussed last week," the agent should be able to quote that specific message in their reply. The quote appears inline: "On Mar 25, you wrote: [original message] — then the agent's reply below. This eliminates the "which message are you referring to?" confusion that plagues long threads. Quote-reply should be accessible via a hover action on each message (quote icon) or via text selection. It must not require more than two clicks total.

6. **Rich content in threads — attachments, images, videos, GST invoices — must render inline without requiring a download.** An agent shouldn't have to click "Download" to view a screenshot a customer attached. Images should display as inline thumbnails that expand on click. PDFs should show a first-page preview. Video attachments should play inline if possible. Files that can't render inline (ZIP, executable) should show a clear file type icon, file name, and size. Never show raw URLs or "Attachment: image.png (click to download)" — that's 1980s email, not modern CRM.

7. **Canned responses and saved templates must integrate into the composer with minimal friction.** Agents handling repetitive ticket types need quick access to templated replies. The canned response picker should: appear via a "/" command in the composer (like Slack), show real-time search across template names and content, insert at cursor position without replacing what the agent has already typed, and allow in-place template editing (agent adds a name or adjusts a placeholder). The failure mode of canned responses: agents avoid them because accessing them requires closing the composer, finding the right template, copying it, and pasting — too many steps for a workflow that should take 3 seconds.

8. **Message timestamps must show relative time ("2 minutes ago") with absolute time on hover — not the reverse.** Agents read "2 minutes ago" at a glance; they read absolute time when they need to verify. Showing "2026-04-01 14:32:07" by default forces constant parsing. The correct pattern: relative time as the primary label ("2m ago", "3h ago", "Yesterday"), absolute timestamp on hover as a tooltip. For messages more than 7 days old, show absolute date + relative ("Apr 1, 3h ago") so agents have calendar context.

9. **The "awaiting customer" state should auto-populate based on thread activity, not require manual status changes.** When an agent sends a reply, the ticket should automatically enter "Pending Customer Response" state. When the customer replies, it should auto-return to "Open." This eliminates the most frequently forgotten manual action in ticket lifecycle management. The auto-transition should be configurable per team and should surface a toast notification when it happens ("Ticket moved to Pending — awaiting customer response"). Never let the ticket sit in "Open" after an agent replies — that state misleads other agents about who owns the next action.

10. **Editing and deleting sent messages must be auditable — soft-delete with visible "(edited)" flag is the right balance.** Agents occasionally send the wrong message or an incomplete reply. The CRM should allow editing within a short window (e.g., 5 minutes) with an "(edited)" label visible to all agents. After 5 minutes, editing should be locked. Deletion should leave a "[Message deleted — see audit log]" placeholder in the thread, visible to agents but clearly marked as removed. Hard deletes with no trace create accountability gaps — agents can't explain why a message disappeared and customers may not remember either.

### How It Applies to Our CRM

- Redesign the composer around two-mode UI: a prominent "Reply" button and a separate "Note" button — not a dropdown toggle. Visually distinguish them: Reply = primary CTA (blue/green), Note = secondary/warning (orange/yellow). Add a confirmation toast on first reply/note per session.
- Style internal notes with yellow/orange tint, lock icon, and "Internal" label. Place them inline in the thread, not in a separate tab. Notes are part of the conversation record — they belong in context.
- Use distinct message types in the thread: customer (left, clean), agent (right or distinct background), internal note (yellow-tinted, locked), system event (gray, italic, subdued). Never let a system event look like a customer message.
- Implement thread collapsing: show first and last 5 messages, with "Show all 47 messages" in the middle. Collapse consecutive messages from the same sender. Always open threads scrolled to the most recent message.
- Add quote-reply: hover on any message to reveal a quote icon. Click to insert the quoted text at cursor position in the composer. Quote appears as "On [date], [sender] wrote: [text]" — styled distinctly from the new reply.
- Render attachments inline: images as thumbnails (expand on click), PDFs as first-page previews, videos playable inline, other file types as clear file cards with icon, name, and size.
- Implement "/" command in composer for canned response insertion. Real-time search across names and content. Insert at cursor without replacing existing draft text.
- Use relative timestamps by default ("2m ago"), absolute on hover. For messages >7 days old, show date + relative ("Apr 1, 3h ago").
- Auto-transition ticket status: agent reply → "Pending Customer"; customer reply → "Open". Show a toast notification on transition. Make configurable per team.
- Implement soft message editing (5-min window, "(edited)" label) and soft delete ("[Message deleted]" placeholder visible in thread, true delete in audit log only).
- Track "accidental note sent to customer" incidents — this is a data breach indicator. Target zero. Any occurrence means the composer UX needs hardening.
- Track average thread length and ticket close rate correlation. Do shorter threads correlate with faster resolution? This informs whether thread collapsing is helping or if agents need more context tools.

---

## Session 54 — 2026-04-01 22:34 UTC
**Topic:** Agent Performance Dashboards & Metrics UX for Ticketing CRMs

### Key Insights

1. **Agent dashboards must answer one question at a glance: "Do I need to act right now?"** The primary purpose of an agent-facing performance dashboard is not motivation or reflection — it's triage. Agents checking their dashboard between tickets need to know immediately: how many tickets are in my queue, how many are at SLA risk, and is my personal CSAT trend healthy. Everything else (weekly trends, distribution charts) belongs in a manager report, not an agent's in-workflow dashboard. Intercom and Zendesk both reserve the agent dashboard's top section for exception indicators (SLA breaches, pending queues) with secondary section for personal stats.

2. **Real-time metrics belong in the queue, not on a separate dashboard tab.** Agents shouldn't have to navigate away from their ticket queue to see their performance state. Key real-time metrics (open ticket count, SLA at-risk count, CSAT this week) should live as persistent widgets or status bars within the queue view itself. A separate "My Dashboard" tab fractures attention — agents lose their queue context to check a number, then return disoriented. Dashboard information should surface in the agent's workflow, not demand the agent go to it.

3. **Manager dashboards must separate team-level metrics from individual agent metrics — and never expose individual agent scores to the team.** A manager overseeing 8 agents needs: team SLA compliance (%), total queue depth, CSAT trend, and avg resolution time. Individual agent performance belongs in a drill-down view, not the team-level overview. Critically: leaderboard-style comparisons between agents ("Sarah: 94% | John: 61%") create unhealthy competition and penalize agents handling difficult customers. If individual scores are visible, they should be visible only to the manager and that agent — not to peers.

4. **Velocity metrics must be presented as context, not judgment — frame around improvement, not ranking.** Showing an agent "Your avg resolution time: 18 min" is neutral data. Showing "You resolved 23 tickets today vs. team avg of 19" is comparative framing that can feel like surveillance. The right pattern: show personal trend over time ("Your avg resolution: 22 min this week, down from 28 min last week — improving") and let managers see peer context in a private manager view only. Metrics that acknowledge context (ticket complexity, channel type) avoid apples-to-oranges comparisons that demotivate agents handling harder cases.

5. **Workload balance visualizations help managers redistribute tickets before queues back up.** A heatmap or bar chart showing ticket distribution across agents lets managers spot imbalances at a glance: "Sarah has 12 open tickets, everyone else has 4-6." Color-coded agent workload in the team queue view (overdue badge on Sarah's avatar) signals who needs relief. The goal is proactive redistribution — managers should be able to reassign 3-4 tickets from an overloaded agent to an underloaded one in under 30 seconds without opening individual tickets.

6. **Gamification mechanics must be opt-in and non-comparative — coercive leaderboards backfire.** Points, badges, and streaks can motivate routine agents but create anxiety for high performers who feel pressured to maintain rankings. The correct gamification UX: personal goals and streaks ("Close 5 tickets today to complete your streak") rather than public leaderboards; achievement badges for milestones (first CSAT 5-star, 100 tickets resolved) that don't rank agents against each other; and team-level goals ("Team resolved 500 tickets this week — 50 to go!") that foster collaboration, not competition. Any gamification that makes an agent feel surveilled or judged will drive avoidance behaviors.

7. **Historical trend lines belong in reports, not real-time dashboards — keep real-time dashboards exception-focused.** A line chart showing "your resolution time over the past 30 days" belongs in a weekly report a manager sends, not in the agent's active workspace. Real-time dashboard cards should show: today's count (open, resolved, at-risk), this week's trend direction (↑↓), and comparison to personal baseline. If an agent wants to see historical trends, provide a "Reports" section — don't pollute the operational dashboard with trending data that requires interpretation rather than action.

8. **CSAT (Customer Satisfaction) display must be attributed correctly — don't credit the team for an individual agent's work.** When a customer rates a ticket 5 stars, the CSAT credit should go to the primary assignee, not the team. If agents see "Team CSAT: 4.2" but know they personally earned 5-star ratings on their tickets, the team metric feels meaningless and unfair. Per-agent CSAT with the ability to drill into which tickets earned which rating gives agents actionable feedback: "My last 3 tickets rated 3 stars — what went wrong?" Without per-ticket CSAT visibility, agents can't learn from ratings.

9. **The "ticket backlog" metric is the single most important team-level indicator for managers.** Queue depth (total open tickets) + backlog age (how long the oldest unassigned ticket has been waiting) tells a manager more about team health than any other single metric. A queue of 40 tickets that's actively being worked is healthier than a queue of 25 where 8 have been sitting unassigned for 3 days. Display both: "Queue: 38 tickets | Oldest unassigned: 2h 14m." This metric should appear at the top of every manager dashboard view, not buried in a report.

10. **Accessibility in dashboard charts: colorblind-safe palettes and pattern alternatives are non-negotiable.** Red/green color coding is the most common chart convention and the most common accessibility failure. Use red/amber/green with secondary shape or pattern cues (e.g., dashed border for amber, solid for red) so colorblind managers and agents can still read urgency. Chart labels should always appear directly on the data (not rely solely on legend colors). This is an ADA compliance consideration for internal tools used by diverse teams.

### How It Applies to Our CRM

- Keep agent-facing dashboards to 3-4 exception-focused metrics: open count, SLA at-risk count, CSAT trend, today's resolved count. Put these widgets in the queue view header, not a separate tab.
- Build manager dashboards with clear hierarchy: team overview (SLA %, queue depth, oldest unassigned) at top, individual agent drill-down below. Never show individual agent scores to other agents.
- Present velocity and CSAT metrics as personal trends ("up from last week") not peer comparisons. Private per-agent view of their own stats with trend direction.
- Add workload visualization to team queue: color-coded agent avatars showing overdue ticket count. Allow managers to select and bulk-reassign tickets from overloaded agents in one view.
- Make gamification opt-in: personal streaks and milestones only. Team goals acceptable. Never implement public agent-vs-agent leaderboards.
- Implement backlog age metric: "Queue: N tickets | Oldest unassigned: Xh Ym" — show this prominently on every manager view.
- Credit CSAT to the primary assignee, not the team. Allow agents to see per-ticket ratings (or at minimum, which recent tickets received low scores).
- Use colorblind-safe palette for all SLA/status indicators: secondary shape cues (icons, borders, patterns) alongside color.
- All dashboard charts must have direct data labels — never rely on legend colors alone. This is both an accessibility and a usability best practice.
- Provide a separate "Reports" section for historical trends and deep analytics. Real-time operational dashboard stays focused on exceptions and today's state.
- Track dashboard usage: which metrics do agents and managers actually click? If CSAT trend is never clicked, it's clutter — remove it from the primary view.
- Add "My improvement" summary card on agent dashboards: shows week-over-week trend for resolution time, CSAT, and tickets resolved. Makes individual progress visible and motivating without peer comparison.

