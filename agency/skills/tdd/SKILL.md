---
name: tdd
description: Test-Driven Development cycle — write failing test first, then implement, then refactor. Mandatory for all code changes. Covers Vitest unit tests and Playwright E2E tests.
---

# Test-Driven Development (TDD)

## The TDD Cycle — Red → Green → Refactor

### 1. RED — Write a Failing Test
```typescript
// Write the test FIRST, describing what the code SHOULD do
it('should return 404 when post does not exist', async () => {
  const response = await GET('/api/posts/nonexistent-id');
  expect(response.status).toBe(404);
  expect(response.json()).toEqual({ error: 'Post not found' });
});
```
Run the test. It MUST fail. If it passes, either:
- The feature already exists (no work needed)
- Your test is wrong (fix the test)

### 2. GREEN — Write Minimum Code to Pass
Write ONLY enough code to make the test pass. No more.
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const post = await db.posts.findUnique({ where: { id: params.id } });
  if (!post) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }
  return Response.json(post);
}
```
Run the test. It MUST pass.

### 3. REFACTOR — Clean Up While Green
Now improve the code without changing behavior:
- Extract duplicated logic
- Improve naming
- Simplify conditionals
Run tests after EVERY refactoring step. They must stay green.

## What to Test

### Unit Tests (Vitest)
- API route handlers: input validation, response format, error cases
- Utility functions: edge cases, error handling
- Business logic: calculations, transformations, state machines
- Component logic: hooks, state management

### E2E Tests (Playwright)
- Critical user flows: auth, onboarding, core features
- Form submissions: validation, success, error states
- Navigation: routing, deep links, back button
- Cross-browser: test on chromium at minimum

## Test File Conventions
```
src/
  components/
    Button.tsx
    Button.test.tsx        ← unit test next to source
  app/
    api/
      posts/
        route.ts
        route.test.ts      ← API test next to route
tests/
  e2e/
    auth.spec.ts           ← E2E tests in dedicated dir
    onboarding.spec.ts
```

## Coverage Requirements
- Aim for 90%+ statement coverage on critical paths
- 100% branch coverage on business logic functions
- Every bug fix MUST include a regression test that fails without the fix

## Running Tests
```bash
# Unit tests
npx vitest run                    # run once
npx vitest watch                  # watch mode
npx vitest run --coverage         # with coverage report

# E2E tests
npx playwright test               # headless
npx playwright test --ui          # interactive UI
npx playwright test --project=chromium  # specific browser
```

## TDD Rules (Non-Negotiable)
1. NEVER write implementation code without a failing test first
2. NEVER skip tests to "move faster" — tests ARE the fast path
3. NEVER commit with failing tests
4. When fixing a bug: write the failing test FIRST, then fix
5. When adding a feature: write the test describing the feature FIRST
6. Run full test suite before every commit and push
7. If coverage drops below threshold, add tests before doing anything else
