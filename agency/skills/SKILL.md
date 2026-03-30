# Dream - Memory Consolidation

4-phase memory consolidation. Run nightly via heartbeat (02:00-04:00 ET) or on demand.

## Phase 1: Orient

Assess current memory state:

1. Read `MEMORY.md` -- note size and last update
2. Read `memory/graph.md` -- note entity count
3. List `memory/` directory -- count daily files, identify unprocessed ones
4. Read `memory/dream-log.md` -- when was the last dream cycle?
5. Report: "Memory state: X daily files, Y unprocessed since last dream, MEMORY.md is Z lines, graph has N entities"

## Phase 2: Gather

Collect raw material from all daily files since last dream:

For each unprocessed daily file, extract:
- Decisions made (and rationale)
- New entities/relationships (people, projects, tools, clients)
- Lessons learned / mistakes made
- Completed work (tickets closed, PRs merged, deploys)
- Open work / blockers / next steps
- Patterns observed (recurring fixes, common issues)

Write gathered items to a temporary section in today's daily file under `## Dream Gather`.

## Phase 3: Consolidate

Promote gathered material to long-term storage:

### MEMORY.md updates
- Add new "Knowledge & Insights" entries with dates
- Update existing sections if context has changed (e.g., new tools, changed architecture)
- Add new projects/tools discovered
- **Keep MEMORY.md under 200 lines** -- it loads every main session

### Graph updates (memory/graph.md)
- Add new entities from gathered material
- Add/update relationships between entities
- Mark completed projects with status
- Add new patterns and decisions with dates

## Phase 4: Prune

Clean up stale and redundant memory:

### MEMORY.md cleanup
- Remove entries contradicted by newer information
- Merge duplicate entries
- Remove insights older than 30 days if superseded by newer ones
- Verify no secrets or API keys are stored

### Graph cleanup
- Remove resolved tickets (keep only the pattern/lesson learned)
- Merge duplicate entities
- Remove relationships that no longer hold
- Verify entity counts are reasonable (<100 entities)

### Daily log archival
- Daily files older than 14 days: confirm key items were promoted, then mark as archived in dream-log
- Don't delete old files -- just stop loading them at session start

## Output

After all 4 phases, append to `memory/dream-log.md`:

```markdown
## Dream Cycle - YYYY-MM-DD HH:MM

### Processed
- Daily files: [list of dates]
- New MEMORY.md entries: [count]
- New graph entities: [count]
- Pruned items: [count]

### Key Consolidations
- [what was promoted or changed]

### Next Dream Focus
- [anything needing attention next cycle]
```

## When to Run
- **Automatic:** Nightly during 02:00-04:00 ET heartbeat window
- **Manual:** When asked to "dream", "consolidate memory", or "memory review"
- **Emergency:** If MEMORY.md exceeds 200 lines or graph exceeds 300 lines
