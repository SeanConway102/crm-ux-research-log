# QA Process for CRM Frontend Changes

## Before Any UI Change

1. **Read the full file** — understand the component structure, state model, and pagination logic
2. **Identify the exact bug** — which state variable, which handler, what the correct behavior should be
3. **Write targeted fix** — one specific edit, not mass sed/replace scripts
4. **Build** — `pnpm build` must pass
5. **Smoke test in browser** — Playwright: log in, navigate to page, verify the fix works
6. **Review diff** — line by line, explain why each change was made
7. **Then** commit and push

## QA Checklist for Pagination Fixes

After any `setData` change, verify:
- [ ] Does the page use `page` state, `cursorIdx`, or flat fetch?
- [ ] Is the `setData` pattern correct for that pagination model?
- [ ] Does the initial load (page 1 / cursorIdx -1) replace data?
- [ ] Does subsequent loads (page > 1 / cursorIdx >= 0) append data?
- [ ] Is there a `toast.error()` for the failed fetch?

## Pagination Pattern Reference

| Page | Pattern | Initial (replace) | Load More (append) |
|------|---------|-------------------|-------------------|
| Deals (board) | flat `limit: 200` | `setData(data)` | N/A (board view) |
| Deals (closed) | `page` + cursorMap | `page === 1` | `page > 1` |
| Sites | `page` + cursorMap | `page === 1` | `page > 1` |
| Companies | `page` + cursorMap | `page === 1` | `page > 1` |
| Payments | `cursorIdx` | `cursorIdx < 0` | `cursorIdx >= 0` |
| Products | `cursorIdx` | `cursorIdx < 0` | `cursorIdx >= 0` |
| Invoices | `cursorIdx` | `cursorIdx < 0` | `cursorIdx >= 0` |
| Subscriptions | `cursorIdx` | `cursorIdx < 0` | `cursorIdx >= 0` |
| Tickets (open) | flat `limit: 200` | `setData(data)` | N/A |
| Tickets (closed) | `closedPage` + cursorMap | `closedPage === 1` | `closedPage > 1` |

## Smoke Test Command

```bash
# Start Chrome CDP
google-chrome --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-session &
sleep 2

# Run Playwright pagination smoke test
node ~/repos/crm-frontend/scripts/smoke-test-pagination.js
```
