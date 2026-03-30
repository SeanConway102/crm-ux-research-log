#!/bin/bash
# CT Media CRM — continuous development check at :30 every hour
# Finds bugs, UI issues, files GitHub issues, makes small fixes

WORKSPACE="/root/.openclaw/workspace-agency"
REPO="/root/repos/crm-frontend"
GH_TOKEN_FILE="$WORKSPACE/.gh_token"
LOG="$WORKSPACE/memory/cron-$(date +%Y-%m-%d).md"

GH_TOKEN=$(cat "$GH_TOKEN_FILE" 2>/dev/null)
LOGFILE="$WORKSPACE/memory/cron.log"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M')] $1"
  echo "$msg" | tee -a "$LOGFILE"
}

# Track what we found/did
FOUND_ISSUES=()
MADE_FIXES=()

log "=== CRM Development Check Starting ==="

# === 1. Health Check ===
health=$(curl -s https://crm-api-1016182607730.us-east1.run.app/health 2>/dev/null)
if echo "$health" | grep -q '"ok"'; then
  log "CRM API: OK"
else
  log "CRM API: UNHEALTHY"
fi

frontend_status=$(curl -s -o /dev/null -w "%{http_code}" https://v0-crm-frontend-build-peach.vercel.app 2>/dev/null)
log "Frontend: HTTP $frontend_status"

# === 2. Git pull to stay up to date ===
cd "$REPO" && git pull origin master 2>/dev/null
if [ $? -eq 0 ]; then
  log "Git pull: OK"
else
  log "Git pull: FAILED"
fi

# === 3. Check open issues count ===
open_count=$(curl -s -H "Authorization: Bearer $GH_TOKEN" \
  "https://api.github.com/repos/SeanConway102/crm-frontend/issues?state=open&per_page=100" | \
  jq 'length' 2>/dev/null)
log "Open issues: $open_count"

# === 4. Find code issues ===
# console.error in server code (should use getLogger)
console_errors=$(grep -rln "console\.error" "$REPO/app/" "$REPO/lib/" 2>/dev/null | grep -v node_modules | wc -l)

# TODO/FIXME that look like bugs
todos=$(grep -rn "TODO.*bug\|TODO.*fix\|FIXME\|HACK\|XXX" \
  "$REPO/app/" "$REPO/components/" "$REPO/lib/" 2>/dev/null | \
  grep -v node_modules | grep -v "// TODO" | wc -l)

# Type: any without justification
type_any=$(grep -rn ": any\|:any\|Array<any>" "$REPO/app/" "$REPO/lib/" 2>/dev/null | \
  grep -v node_modules | grep -v "// any" | grep -v "as any" | wc -l)

# Unused imports (simple heuristic)
unused_imports=$(grep -rn "^import.*from.*// " "$REPO/app/" "$REPO/components/" 2>/dev/null | \
  grep -v node_modules | wc -l)

log "Code scan — console.error: $console_errors, TODO/FIXME: $todos, type:any: $type_any, unused imports: $unused_imports"

# === 5. File issues for findings ===
# Only file if we haven't already filed one about this

if [ "$todos" -gt 0 ]; then
  # Check if issue already exists
  existing=$(curl -s -H "Authorization: Bearer $GH_TOKEN" \
    "https://api.github.com/repos/SeanConway102/crm-frontend/issues?state=open&per_page=100" | \
    jq '[.[] | select(.title != null and (.title | test("TODO"; "i")))] | length')
  if [ "$existing" -eq 0 ]; then
    result=$(curl -s -X POST -H "Authorization: Bearer $GH_TOKEN" \
      -H "Content-Type: application/json" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/SeanConway102/crm-frontend/issues" \
      -d '{
        "title": "chore: audit and address TODO/FIXME/HACK comments",
        "body": "## Found\n'"$todos"' TODO/FIXME/HACK comments found in codebase.\n\nRun this to find them:\n```bash\ngrep -rn \"TODO.*fix\\|FIXME\\|HACK\\|XXX\" app/ components/ lib/\n```\n\n## Priority\nFilter for ones that describe bugs vs unimplemented features. File separate issues for actual bugs.",
        "labels": ["tech-debt"]
      }' | jq '{number, title}')
    log "Filed issue: $result"
  fi
fi

if [ "$type_any" -gt 0 ]; then
  existing=$(curl -s -H "Authorization: Bearer $GH_TOKEN" \
    "https://api.github.com/repos/SeanConway102/crm-frontend/issues?state=open&per_page=100" | \
    jq '[.[] | select(.title != null and (.title | test("any.*type|type.*any"; "i")))] | length')
  if [ "$existing" -eq 0 ]; then
    result=$(curl -s -X POST -H "Authorization: Bearer $GH_TOKEN" \
      -H "Content-Type: application/json" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/SeanConway102/crm-frontend/issues" \
      -d "{
        \"title\": \"chore: reduce TypeScript any usage — add strict types\",
        \"body\": \"Found $type_any instances of 'any' without strict typing.\n\nRun to audit:\ngrep -rn ': any|:any' app/ lib/ | grep -v 'as any|// any'\",
        \"labels\": [\"tech-debt\", \"typescript\"]
      }" | jq '{number, title}')
    log "Filed issue: $result"
  fi
fi

# === 6. Check for obvious UI bugs (common patterns) ===
# Check for inline styles that should be Tailwind
inline_styles=$(grep -rln "style={{" "$REPO/app/" "$REPO/components/" 2>/dev/null | \
  grep -v node_modules | grep -v "style={{ '|" | wc -l)

# Check for hardcoded strings that should be i18n
hardcoded_strings=$(grep -rn "<'>\"/\\\"[A-Z]" "$REPO/app/" "$REPO/components/" 2>/dev/null | \
  grep -v node_modules | grep -v "className" | grep -v "// " | head -5 | wc -l)

# === 7. Summary ===
log "Console errors: $console_errors | TODO/FIXME: $todos | type:any: $type_any"

# === 8. Track new pushes for notification ===
LAST_COMMIT_FILE="$WORKSPACE/memory/last-push-commit"
NOTIFY_FILE="$WORKSPACE/memory/pending-notifications.md"
last_reported=$(cat "$LAST_COMMIT_FILE" 2>/dev/null || echo "")
latest_commit=$(cd "$REPO" && git rev-parse HEAD 2>/dev/null || echo "")

if [ -n "$latest_commit" ] && [ "$latest_commit" != "$last_reported" ]; then
  cd "$REPO"
  commits_since=$(git log --oneline "$last_reported"..HEAD 2>/dev/null | head -10 || echo "")
  commit_count=$(git rev-list --count "$last_reported"..HEAD 2>/dev/null || echo "1")

  if [ -n "$commits_since" ]; then
    timestamp=$(date '+%Y-%m-%d %H:%M UTC')
    echo "## $timestamp — $commit_count commit(s)" >> "$NOTIFY_FILE"
    echo '```' >> "$NOTIFY_FILE"
    echo "$commits_since" >> "$NOTIFY_FILE"
    echo '```' >> "$NOTIFY_FILE"
    echo "" >> "$NOTIFY_FILE"
    log "New commits tracked for notification"
  fi
  echo "$latest_commit" > "$LAST_COMMIT_FILE"
fi

log "=== CRM Development Check Complete ==="
echo "" >> "$LOGFILE"
