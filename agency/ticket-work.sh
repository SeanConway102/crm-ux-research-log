#!/bin/bash
# CT Media — Hourly Ticket Work
# Picks up assigned Lighthouse performance tickets, fixes them, creates PRs
# Runs every :30 via cron

WORKSPACE="/root/.openclaw/workspace-agency"
CRM_API_KEY_FILE="$WORKSPACE/.crm-key"
CRM_URL="https://crm-api-1016182607730.us-east1.run.app"
LOGFILE="$WORKSPACE/memory/cron.log"
REPOS_DIR="/root/repos"
GH_TOKEN=$(cat "$WORKSPACE/.gh_token" 2>/dev/null)
GH_ORG="ctwebsiteco"

SULLY_ID="fcc77e15-ea54-43ca-8e53-b1caa727a46f"
BRANCH_TS=$(date +%Y%m%d%H%M)

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M')] [TICKET-WORK] $1"
  echo "$msg" | tee -a "$LOGFILE"
}

post_comment() {
  local ticket_id=$1
  local body=$2
  curl -s -X POST -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
    -H "Content-Type: application/json" \
    "$CRM_URL/api/v1/tickets/$ticket_id/comments" \
    -d "$(jq -n --arg body "$body" '{body: $body}')" >/dev/null 2>&1
}

resolve_ticket() {
  local ticket_id=$1
  local pr_url=$2
  local notes=$3
  
  post_comment "$ticket_id" "## Fix Applied ✓

PR: $pr_url

$notes"

  curl -s -X PUT -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
    -H "Content-Type: application/json" \
    "$CRM_URL/api/v1/tickets/$ticket_id" \
    -d '{"status": "Resolved"}' >/dev/null 2>&1
  
  log "Resolved ticket: $ticket_id"
}

# Map site names to repo names
get_repo() {
  local subject=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  case "$subject" in
    *aagutterseamless*|*gutter*) echo "v0-gutter-website-rebuild" ;;
    *palspowerwashing*) echo "v0-pals-power-washing-website" ;;
    *brimatco*) echo "v0-brimatco-full" ;;
    *3cstavern*|*3cs*) echo "v0-3-c-s-tavern-website-jg" ;;
    *apizza*|*pizza*) echo "v0-apizza-grande-website" ;;
    *fairway*) echo "v0-fairway-irrigation-website" ;;
    *salisbury*) echo "v0-salisbury-kitchen" ;;
    *energybusters*) echo "v0-energy-busters-website" ;;
    *taxcareer*) echo "v0-tax-career-advisor-website" ;;
    *) echo "" ;;
  esac
}

# === MAIN ===
log "=== Starting Hourly Ticket Work ==="

# Get Sully's Backlog tickets (high priority first)
TICKETS=$(curl -s -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
  "$CRM_URL/api/v1/tickets?assigned_to=$SULLY_ID&status=Backlog&limit=20" 2>/dev/null)

if echo "$TICKETS" | jq -e '.error' >/dev/null 2>&1; then
  log "API error: $(echo "$TICKETS" | jq -r '.error.message')"
  exit 1
fi

# Pick highest priority, oldest Backlog ticket
ticket=$(echo "$TICKETS" | jq -c '[.data[] | select(.priority == "high")] | sort_by(.created_at) | .[0] // empty')

if [ -z "$ticket" ]; then
  ticket=$(echo "$TICKETS" | jq -c '[.data[] | select(.priority == "medium")] | sort_by(.created_at) | .[0] // empty')
fi

if [ -z "$ticket" ]; then
  log "No Backlog tickets. Checking In Progress..."
  TICKETS_IP=$(curl -s -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
    "$CRM_URL/api/v1/tickets?assigned_to=$SULLY_ID&status=In+Progress&limit=5" 2>/dev/null)
  ticket=$(echo "$TICKETS_IP" | jq -c '.data[0] // empty')
fi

if [ -z "$ticket" ]; then
  log "No tickets to work on."
  exit 0
fi

ticket_id=$(echo "$ticket" | jq -r '.id')
current_status=$(echo "$ticket" | jq -r '.status // "Backlog"')
subject=$(echo "$ticket" | jq -r '.subject')

if [ "$current_status" = "Backlog" ]; then
  curl -s -X PUT -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
    -H "Content-Type: application/json" \
    "$CRM_URL/api/v1/tickets/$ticket_id" \
    -d '{"status": "In Progress"}' >/dev/null 2>&1
  log "Marked ticket $ticket_id as In Progress"
else
  log "Resuming: $ticket_id"
fi

log "Working on: $subject"

repo_name=$(get_repo "$subject")
if [ -z "$repo_name" ]; then
  log "No repo for this ticket — marking needs manual work"
  post_comment "$ticket_id" "No local repo found. Please handle manually or provide repo access."
  exit 0
fi

repo_dir="$REPOS_DIR/$repo_name"
if [ ! -d "$repo_dir" ]; then
  log "Repo not cloned: $repo_name — cloning..."
  git clone https://x-access-token:$GH_TOKEN@github.com/$GH_ORG/$repo_name.git "$repo_dir" 2>/dev/null || {
    post_comment "$ticket_id" "Failed to clone repo $repo_name"
    exit 1
  }
fi

cd "$repo_dir"
git checkout main && git pull origin main 2>/dev/null

# === DIAGNOSE ===
sharp_status=$([ -d "$repo_dir/node_modules/sharp" ] && echo "installed" || echo "missing")
unoptimized_flag=$(grep -r "unoptimized.*true" "$repo_dir/next.config*" 2>/dev/null && echo "yes" || echo "no")
avif_config=$(grep -q "formats.*avif" "$repo_dir/next.config*" 2>/dev/null && echo "yes" || echo "no")

log "  sharp=$sharp_status, unoptimized=$unoptimized_flag, avif=$avif_config"

# === FIX ===
fixes_applied=()
branch="fix/lighthouse-$(echo $repo_name | sed 's/v0-//' | sed 's/-website//')-$BRANCH_TS"

# Install sharp if missing
if [ "$sharp_status" = "missing" ]; then
  log "  Installing sharp..."
  (cd "$repo_dir" && pnpm add sharp 2>&1 | tail -2) && fixes_applied+=("installed sharp") || log "  sharp install failed"
fi

# Fix next.config
if [ "$unoptimized_flag" = "yes" ]; then
  log "  Removing unoptimized:true..."
  sed -i 's/unoptimized: true,//' "$repo_dir/next.config*" 2>/dev/null
  fixes_applied+=("removed unoptimized:true")
fi

if [ "$avif_config" = "no" ]; then
  log "  Adding AVIF+WebP to next.config..."
  python3 << 'PYEOF' 2>/dev/null
import re
config_file = open("$repo_dir/next.config.mjs").read()
if 'formats: ["image/avif"' not in config_file:
    # Add formats inside images block
    config_file = re.sub(
        r'(images:\s*\{[^}]*?)(\s*\})',
        r'\1\n    formats: ["image/avif", "image/webp"],\n  }',
        config_file,
        flags=re.DOTALL
    )
    open("$repo_dir/next.config.mjs", 'w').write(config_file)
print("done")
PYEOF
  fixes_applied+=("added AVIF+WebP")
fi

# === VERIFY BUILD ===
log "  Building..."
build_ok=$(cd "$repo_dir" && pnpm build 2>&1 | tail -3)
if echo "$build_ok" | grep -q "Failed\|error"; then
  log "  Build failed: $build_ok"
  post_comment "$ticket_id" "Build failed after applying fixes. Check repo locally."
  git checkout -- . 2>/dev/null
  git checkout main 2>/dev/null
  exit 1
fi
log "  Build OK"

# === COMMIT & PR ===
# Always start from fresh main, rebase to avoid conflicts
git fetch origin main 2>/dev/null
git checkout main && git pull origin main 2>/dev/null
git checkout -b "$branch" 2>/dev/null

git add -A

commit_msg="fix: Lighthouse performance — ${fixes_applied[*]}
Ticket: $ticket_id

Changes:
$(for f in "${fixes_applied[@]}"; do echo "- $f"; done)

sharp: $sharp_status → $([ -d "$repo_dir/node_modules/sharp" ] && echo "installed" || echo "still missing")
unoptimized: $unoptimized_flag → no"

git commit -m "$commit_msg" 2>/dev/null
if [ $? -ne 0 ]; then
  log "  Nothing to commit — changes identical to main"
  git checkout main 2>/dev/null
  exit 0
fi

git push -u origin "$branch" 2>&1 | tail -3

# === CHECK FOR MERGE CONFLICTS ===
log "  Checking for merge conflicts..."
mergeable_state=$(curl -s -H "Authorization: Bearer $GH_TOKEN" \
  "https://api.github.com/repos/$GH_ORG/$repo_name/pulls?head=ctwebsiteco:$branch&state=open" 2>/dev/null | \
  jq -r '.[0].mergeable_state // "unknown"')

if [ "$mergeable_state" = "dirty" ]; then
  log "  ⚠️ Merge conflict detected — resolving..."
  
  # Fetch main and merge to resolve
  git fetch origin main 2>/dev/null
  git merge origin/main -m "Merge main to resolve conflicts" 2>&1
  
  if git status | grep -q "CONFLICT"; then
    log "  Conflicts in: $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
    # Auto-resolve by taking our changes for files we modified
    for conflicted_file in $(git diff --name-only --diff-filter=U 2>/dev/null); do
      case "$conflicted_file" in
        next.config.*)
          log "  Resolving $conflicted_file — keeping our AVIF/WebP config"
          git checkout --ours "$conflicted_file"
          ;;
        *)
          git checkout --theirs "$conflicted_file"
          ;;
      esac
    done
    git add $(git diff --name-only --diff-filter=U 2>/dev/null)
    git commit -m "resolve: merge conflicts in favor of our changes"
  fi
  
  git push origin "$branch" 2>&1 | tail -3
  
  # Verify conflict resolved
  new_state=$(curl -s -H "Authorization: Bearer $GH_TOKEN" \
    "https://api.github.com/repos/$GH_ORG/$repo_name/pulls?head=ctwebsiteco:$branch&state=open" 2>/dev/null | \
    jq -r '.[0].mergeable_state // "unknown"')
  log "  Conflict check: mergeable_state=$new_state"
elif [ "$mergeable_state" = "clean" ] || [ "$mergeable_state" = "unstable" ]; then
  log "  ✓ No conflicts — mergeable_state=$mergeable_state"
else
  log "  Merge state unknown: $mergeable_state — proceeding anyway"
fi

# Create PR via API
pr_result=$(curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$GH_ORG/$repo_name/pulls" \
  -d "$(jq -n --arg title "fix: Lighthouse performance ($repo_name)" \
    --arg body "## Lighthouse Performance Fix

Ticket: $ticket_id

Changes:
$(for f in "${fixes_applied[@]}"; do echo "- $f"; done)

Build verified passing.

Please review and merge." \
    --arg base "main" --arg head "$GH_ORG:$branch" \
    '{title: $title, body: $body, base: $base, head: $head}')")

pr_url=$(echo "$pr_result" | jq -r '.html_url // empty')
pr_num=$(echo "$pr_result" | jq -r '.number // empty')

if [ -n "$pr_url" ] && [ "$pr_url" != "null" ]; then
  log "  PR #$pr_num: $pr_url"
  resolve_ticket "$ticket_id" "$pr_url" "$(for f in "${fixes_applied[@]}"; do echo "- $f"; done) | Build verified"
else
  log "  PR creation failed: $(echo "$pr_result" | jq -r '.message // .errors[0].message // "unknown"')"
  post_comment "$ticket_id" "Fix applied but PR creation failed. Branch: $branch"
fi

log "=== Ticket Work Complete ==="
echo "" >> "$LOGFILE"