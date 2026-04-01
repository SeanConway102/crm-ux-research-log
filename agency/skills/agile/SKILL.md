---
name: agile
description: Agile development workflow for autonomous agents — sprint planning, daily standups, sprint review, retrospective, definition of done. Integrates with Linear/CRM ticket systems.
---

# Agile Development Workflow

## Sprint Structure (1-Week Sprints)

### Sprint Planning (Start of Sprint)
1. Review the ticket backlog (Linear for Mike, CRM for Sully)
2. Pick 3-7 tickets sized for the sprint
3. Break each ticket into tasks:
   - Write tests (TDD — tests first)
   - Implement feature/fix
   - Run full test suite
   - Create PR
   - QA/review
4. Set sprint goal: one sentence describing the sprint's primary outcome
5. Write sprint plan to `learning/sprint-planning/YYYY-MM-DD.md`

### Daily Standup (Every Morning)
Report three things:
1. **Done since last standup:** completed tasks with ticket IDs
2. **Doing today:** planned tasks with priority order
3. **Blockers:** anything preventing progress

Format:
```markdown
## Standup — YYYY-MM-DD
**Done:** Completed CTM-229 WebSocket server (tests passing, PR open)
**Doing:** CTM-230 Presence UI (writing E2E tests first)
**Blockers:** None / Waiting on security review for CTM-233
```

### Sprint Review (End of Sprint)
1. Demo what was built — list features with evidence (test results, screenshots, deployed URLs)
2. What was completed vs planned
3. What rolled over and why
4. Update metrics: velocity (tickets completed), coverage %, deploy count

### Sprint Retrospective (End of Sprint)
1. **What went well?** — processes/tools that helped
2. **What didn't go well?** — friction, failures, wasted time
3. **What to improve?** — specific, actionable changes for next sprint
4. Write retro to `learning/reflections/YYYY-MM-DD.md`

## Definition of Done (DoD)
A ticket is DONE only when ALL of these are true:
- [ ] Tests written (TDD — written before implementation)
- [ ] All tests pass (unit + E2E where applicable)
- [ ] Coverage threshold met (project-specific)
- [ ] Code committed to feature branch with conventional commit messages
- [ ] PR created with description (what, why, how to test)
- [ ] PR reviewed (by another agent or human)
- [ ] Deployed to preview (Vercel preview URL working)
- [ ] No regressions (existing tests still pass)

## Ticket Workflow
```
Backlog → Selected → In Progress → In Review → Done
```

When picking up a ticket:
1. Move to "In Progress"
2. Create feature branch: `feature/<ticket-id>-<description>`
3. Write failing tests first (TDD Red phase)
4. Implement (TDD Green phase)
5. Refactor (TDD Refactor phase)
6. Run full test suite
7. Commit with conventional message referencing ticket
8. Push branch, create PR
9. Move to "In Review"
10. After approval + merge, move to "Done"

## Velocity Tracking
Track per sprint:
- Tickets planned vs completed
- Tests written
- Coverage delta
- PRs merged
- Deploy count

Store in `learning/daily/YYYY-MM-DD.md` and promote patterns to `learning/reflections/`.

## Rules
- Never work on more than one ticket at a time
- Never skip the DoD checklist
- If a ticket is bigger than 1 day of work, break it down
- If blocked for >2 hours, escalate or switch tickets
- Every sprint must have at least one shipped feature
