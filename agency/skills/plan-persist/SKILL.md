---
name: plan-persist
description: Persist work plans across sessions using checkpoint files. Use when a task will take more than one session or could be interrupted by compaction. Write state to files so the next session can resume.
---

# Plan Persistence — Survive Compaction

Context windows are temporary. Plans must outlast them.

## When to Use
- Task will take more than 15 minutes of sustained work
- Task has more than 5 steps
- Task involves multiple files, tools, or agents
- You're about to hit compaction and need to save state

## Creating a Plan

Write a plan file to your memory directory: `memory/plan-<name>.md`

```markdown
# Plan: <Goal>
Status: active
Created: YYYY-MM-DD

## Steps
- [ ] Step 1: <action>
- [ ] Step 2: <action>
- [ ] Step 3: <action>

## Current Position
Phase X, Step Y

## Context for Next Session
<Key facts and decisions that the next session needs to know>

## Blockers
<Anything preventing progress>

## Next Action
<The very first thing the next session should do>
```

## Checkpointing (Do This Every 15 Minutes)

Update your plan file with:
1. Mark completed steps with [x]
2. Update "Current Position"
3. Update "Context for Next Session" with new decisions/findings
4. Update "Next Action"

## Resuming a Plan

At session start, check memory for plan files:
1. Read any `memory/plan-*.md` files
2. Find plans with `Status: active`
3. Read the "Next Action" field
4. Continue from there

## Completing a Plan

When done:
1. Mark `Status: completed`
2. Write a brief "What was learned" section
3. Move key learnings to MEMORY.md or daily log
4. If you followed a repeatable process, consider creating a skill (/self-evolve)

## Rules
- One plan per goal — don't create 10 plans
- Update the plan file, don't create new files for each checkpoint
- Keep "Context for Next Session" concise — just the essentials
- Plans are working documents, not records — keep them current
