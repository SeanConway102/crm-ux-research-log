# Research Log

Tags: [ux], [react], [dx]

---

## 2026-03-31 — React 19 `useOptimistic` for Comment Threads

### What I Learned

`useOptimistic` (React 19) enables **optimistic UI updates** — the UI updates instantly on user action, assuming the server call will succeed, then rolls back if it fails. This is the pattern behind "instant feedback" in social apps (likes, comments, etc.).

**The core pattern:**
```tsx
const [optimisticComments, addOptimisticComment] = useOptimistic(
  comments,                          // current state
  (state, newComment) => [...state, newComment]  // reducer
)

async function handleSubmit(formData: FormData) {
  const optimistic = { id: Date.now(), body: "...", pending: true }
  addOptimisticComment(optimistic)   // instant UI update
  await fetch("/api/comments", { body: formData }) // server call
  // on success: real comment replaces optimistic one
  // on failure: optimistic comment removed, error shown
}
```

**Why this matters for the portal's ticket comments:**
- Comment threads feel instant, not like a form submission
- Users get visual feedback immediately (comment appears with "pending" state)
- Works naturally with React Server Actions in Next.js 15
- Fallback: if server fails, comment is removed cleanly

**Key insight from research:** The distinction between `useOptimistic` + Server Action vs. `useFormState`:
- `useOptimistic` — for arbitrary optimistic state (comments, likes, toggles)
- `useFormState` (now `useActionState`) — for form field updates based on server response

For a comment form, `useOptimistic` + Server Action is the ideal combo:
1. `useOptimistic` → immediate comment appears
2. Server Action → POSTs to API, returns the real comment
3. If the server returns the real comment, optimistic comment is "confirmed"

**Potential pitfalls:**
- Race conditions: rapid submissions need a queue
- Rollback UX: user sees comment disappear on failure — needs a toast explaining why
- Id generation: optimistic IDs must be temporary and replaced by server IDs

### How It Applies to This Project

The ticket detail page (being built today) uses `useOptimistic` for the comment form. This makes the comment thread feel native and responsive — critical for a support portal where users are often anxious about whether their message was received.

The comment form:
1. User types and submits
2. Comment appears immediately with a subtle "sending..." indicator
3. On success: indicator disappears, comment is confirmed
4. On failure: comment fades out, error toast appears with retry option

This is dramatically better UX than a loading spinner + page refresh.

---
