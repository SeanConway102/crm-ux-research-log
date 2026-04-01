---
name: self-evolve
description: Create new skills from successful patterns. When you complete a multi-step task successfully, extract the pattern as a reusable SKILL.md. Only creates NEW skills — never modifies SOUL.md, AGENTS.md, or existing skills.
---

# Self-Evolution — Turn Patterns into Skills

## When to Create a Skill
- You did the same multi-step process for the 2nd time (CAPTURED)
- A task was hard but you figured it out and it shouldn't be hard next time (CAPTURED)
- You combined two existing approaches into something more powerful (DERIVED)
- An existing approach failed and you found a better way (FIX — create improved version)

## How to Create a Skill

### Step 1: Identify the Pattern
After completing a successful task, ask:
- Did I follow a repeatable sequence of steps?
- Would a future session benefit from having these steps documented?
- Is this specific enough to be actionable but general enough to reuse?

### Step 2: Write the SKILL.md
Create a new file in your skills directory: `skills/<skill-name>/SKILL.md`

```markdown
---
name: <skill-name>
description: <When to use this and what it does — one sentence>
---

# <Skill Name>

## When to Use
<Trigger conditions>

## Steps
1. <Concrete step>
2. <Concrete step>
...

## Anti-Patterns
- <What NOT to do>
```

### Step 3: Verify
- Is each step specific and actionable?
- Does the description clearly explain when to trigger?
- Are anti-patterns listed to prevent common mistakes?

## Safety Rules
- ONLY create NEW skill files in the skills/ directory
- NEVER modify SOUL.md, AGENTS.md, IDENTITY.md, or USER.md
- NEVER modify existing skills — create a new one with a different name
- NEVER create skills that grant yourself new tool permissions
- Log what you created in today's daily memory file
