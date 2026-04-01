# CRM UX Research Log

## Session 30 — 2026-04-01 00:30 UTC
**Topic:** AI-Assisted Ticket Features & Smart Autonomy UX for Ticketing CRMs

### Key Insights

1. **AI suggestions must be opt-in and clearly labeled — never auto-execute without the agent's consent.** The single biggest UX fear with AI in CRMs is that it will reply to customers autonomously and embarrass the company. Every AI action (suggested reply, auto-categorize, auto-tag, draft response) must be: clearly surfaced as a *suggestion* with a visible "AI suggestion" label, not auto-sent, and easy to accept with one click or reject entirely. Agents should feel like AI is their copilot, not their replacement. Gmail's "Smart Compose" (accept with Tab) is the reference UX: suggestions appear inline, are easy to take, and easy to ignore without friction.

2. **AI confidence scores must be visible — not just the suggestion.** When the AI suggests a category or sentiment, showing "87% confidence" vs. "52% confidence" tells the agent how much weight to give the suggestion. Low-confidence suggestions warrant more agent scrutiny; high-confidence suggestions can be accepted faster. Hiding confidence creates a false equivalence between confident and uncertain AI outputs — agents can't calibrate their trust without this signal. Color-code confidence bands: green (80%+), amber (60-79%), red (<60%).

3. **Agents must be able to correct AI and teach it inline — one click to say "wrong."** When an agent rejects or modifies an AI suggestion, the system should capture that feedback with zero extra effort: "AI suggested: Billing — You chose: Technical → Feedback logged." This implicit feedback loop improves future suggestions without requiring a formal "train this model" workflow. The key UX requirement: correction must be faster than ignoring the suggestion. If rejecting an AI suggestion takes more time than just writing the right answer, agents will ignore AI entirely.

4. **AI-generated reply drafts should be editable *before* sending, not after.** Agents need to see the AI draft, edit it inline, and send their edited version — not the original AI version. The CRM must track what the agent actually sent, not what the AI drafted. This matters for CSAT attribution: a customer rating a 3/5 on an AI-assisted reply that the agent significantly edited should not penalize the AI model — it should flag that the agent modified it substantially. Sending the original AI draft instead of the edited version is a trust-breaking bug.

5. **AI triage (routing, priority, category) should surface its reasoning — not just output a label.** "AI categorized as: Billing" is opaque. "AI categorized as: Billing (reason: customer subject mentions 'invoice' and 'charge', 91% confidence)" gives the agent context to validate or override. Intercom's AI triage shows a reasoning panel: "I categorized this as a billing issue because..." — agents can accept or adjust. Transparent reasoning builds trust in AI triage and catches systematic AI errors before they propagate across hundreds of tickets.

6. **"AI assist" must not become a crutch that degrades agent skill development over time.** If AI always suggests the right category, agents stop learning category logic. If AI always drafts replies, agents lose drafting skills. The UX should support learning: when AI makes a suggestion, briefly surface *why* it made that choice (rule or pattern reference) so agents internalize the reasoning. Consider an "AI help level" setting: full suggestions (beginner mode) vs. anomaly flagging only (agent writes full replies, AI flags unusual tickets). Ramp new agents onto full AI assist; ramp them off as they gain seniority.

7. **AI summarization of long ticket threads before an agent picks one up is the highest-value AI feature for ticket handling.** A customer has exchanged 12 emails over 3 days. The AI-generated tl;dr: "Customer: reported unauthorized charge on Mar 29. Agent John refunded $49 on Mar 30. Customer replies: 'that's not the charge I meant' — unresolved." Agents reading summaries vs. full threads show dramatically faster context-gathering. This is low-risk: it's for the agent's benefit, not the customer's. It's also the AI feature with the clearest ROI for handling legacy tickets and tickets escalated between agents.

8. **AI anomaly detection should flag tickets that deviate from normal patterns — not just route them.** An unusually angry customer, an abnormally long thread for a simple category, a ticket with a word count 5x the average — these are "something is off" signals. The AI should surface: "⚠️ Unusual: ticket sentiment has escalated 3 times in this thread — supervisor review suggested." This goes beyond triage into predictive flagging. Agents benefit from knowing when a ticket needs extra care, not just which bucket it belongs in.

9. **AI suggestions must be throttleable during focus/high-intensity work periods.** When an agent is in focus mode handling a complex ticket, an AI suggestion popup every 30 seconds is disruptive, not helpful. AI assist should detect high-intensity ticket contexts (long threads, complex categories, customer sentiment negative) and reduce suggestion frequency. Let agents set their own AI assist intensity: "High (suggest constantly)," "Medium (suggest on simple tickets only)," "Low (only when I ask)." Power users will prefer less AI noise; new agents will want more.

10. **AI can and should draft internal notes, not just customer replies.** Agents spending time writing "Internal: escalating to Tier-2 for pricing override review — customer has been a member for 4 years" is wasted cognitive load. AI should offer to draft internal note summaries with @mention tagging. Internal note drafting is lower risk than customer-facing reply drafting — if the AI note is wrong, an agent reviews and edits it; the customer never sees it. This is a good training ground for AI features: start with internal note drafts, build confidence, then expand to customer replies.

### How It Applies to Our CRM

- Present all AI suggestions with an explicit "AI suggestion" visual label and confidence score. Never auto-execute AI actions — always require agent confirmation.
- Show AI reasoning (why it categorized, routed, or prioritized a ticket a certain way) in a collapsible reasoning panel, not just the output label.
- Log implicit AI feedback: when an agent accepts, modifies, or rejects a suggestion, record the action with one click. Make rejection faster than writing from scratch.
- For AI reply drafts: show the draft in an editable composer. Track and attribute what the agent actually sent, not what the AI drafted — for CSAT correlation.
- Add AI thread summarization: generate a tl;dr for tickets with 3+ exchanges. Show summary when agents open a ticket they didn't last reply to.
- Implement AI confidence bands with color coding: green (80%+), amber (60-79%), red (<60%). Red-confidence suggestions warrant full agent scrutiny.
- Build an "AI help level" setting per agent: Full assist (new agents) vs. Anomaly flagging only (senior agents). Let agents tune suggestion frequency.
- Add AI anomaly detection: flag unusual sentiment escalation, abnormally long threads for simple categories, tickets with unusual word counts.
- Offer AI-assisted internal note drafting with @mention suggestions — lower risk than customer reply AI, good training ground for the feature.
- Implement AI suggestion throttle based on ticket complexity and agent focus state — reduce noise during complex tickets or focus mode.
- Track AI suggestion acceptance rate per agent and per category — identify where AI is helpful vs. where it consistently needs correction. Use this to improve model confidence thresholds.
