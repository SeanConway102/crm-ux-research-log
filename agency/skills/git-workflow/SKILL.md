---
name: git-workflow
description: Git workflow for OpenClaw agents — branch naming, conventional commits, PR workflow, pre-commit checks. Use for all code changes.
---

# Git Workflow

## Branch Strategy
Always create a feature branch. NEVER commit directly to main.

```bash
# Create feature branch
git checkout -b feature/<ticket-id>-<short-description>

# Examples
git checkout -b feature/CTM-229-websocket-server
git checkout -b fix/CTM-233-reaction-sanitization
git checkout -b refactor/lighthouse-audit-cleanup
```

Branch prefixes:
- `feature/` — new functionality
- `fix/` — bug fix
- `refactor/` — code improvement, no behavior change
- `test/` — adding/fixing tests only
- `docs/` — documentation only

## Commit Messages (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`

Examples:
```
feat(watch-party): add real-time presence indicators
fix(auth): handle expired JWT tokens gracefully
test(api/posts): add unit tests for pagination edge cases
refactor(lighthouse): extract audit runner into reusable module
```

Rules:
- Subject line: imperative mood, lowercase, no period, max 72 chars
- Body: explain WHY, not WHAT (the diff shows what)
- Reference ticket ID when available: `Closes CTM-229`

## Pre-Commit Checks
Before EVERY commit, run:
```bash
# 1. Lint
npm run lint || pnpm lint

# 2. Tests
npm run test || pnpm test

# 3. Only then commit
git add <specific-files>
git commit -m "feat(scope): description"
```

DO NOT commit if lint or tests fail. Fix first.
DO NOT use `git add .` — add specific files to avoid committing secrets or artifacts.

## PR Workflow
```
1. Branch from main
2. Make commits (small, focused, tested)
3. Push branch to remote
4. Create PR with description:
   - What: summary of changes
   - Why: motivation/ticket reference
   - How to test: steps for reviewer
   - Screenshots: if UI changes
5. Wait for review/approval
6. Merge to main (squash or merge commit per project convention)
```

## Rules
- One logical change per commit
- One feature/fix per PR
- Keep PRs small (< 400 lines when possible)
- Write the test BEFORE the implementation (TDD)
- Run the full test suite before pushing
