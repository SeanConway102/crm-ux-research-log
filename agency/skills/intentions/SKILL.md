---
name: intentions
description: Manage prospective memory — track pending tasks with event-based and time-based triggers so nothing falls through the cracks across sessions. Check at session start and during heartbeat.
---

# Intentions — Remember to Remember

Maintain a PENDING.md file in your workspace to track future actions.

## Format
```markdown
# Pending Intentions

## Urgent
- [ ] **When:** [trigger condition] → **Action:** [what to do]

## Event-Based
- [ ] **When:** [specific event happens] → **Action:** [response]

## Time-Based
- [ ] **When:** [date/time] → **Action:** [what to do]

## Completed
- [x] **Done 2026-04-01:** [what was completed]
```

## When to Add Intentions
- A task is blocked waiting on something → add event trigger for when it unblocks
- You promise to follow up on something → add time trigger
- You notice something that needs attention later → add event trigger
- A cron job fails → add intention to investigate next session
- You discover a bug but can't fix it now → add intention with context

## When to Check Intentions
1. **Every session start** — read PENDING.md, check if any triggers match
2. **Every heartbeat** — scan for overdue time-based triggers
3. **After completing a task** — did this completion trigger any pending intentions?

## Rules
- Convert relative dates to absolute: "next week" → "2026-04-08"
- Be specific about the trigger: "When PR is approved" not "When ready"
- Include enough context that a future session can act without re-researching
- Mark completed items with [x] and move to Completed section
- Prune completed items monthly
