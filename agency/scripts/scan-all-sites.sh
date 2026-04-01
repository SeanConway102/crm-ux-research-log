#!/usr/bin/env bash
# =============================================================================
# scan-all-sites.sh — Scan all ctwebsiteco Vercel deployments for build errors
# =============================================================================
# Usage: ./scripts/scan-all-sites.sh
# Requires: curl, python3, bash
# =============================================================================

set -euo pipefail

GH_TOKEN="${GITHUB_TOKEN:-<GITHUB_TOKEN_PLACEHOLDER>}"
VC_TOKEN="${VERCEL_TOKEN:-<VERCEL_TOKEN_PLACEHOLDER>}"
VC_API="https://api.vercel.com"
GH_API="https://api.github.com"
ORG="ctwebsiteco"

# ── Colours ─────────────────────────────────────────────────────────────────
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

# ── Helpers ──────────────────────────────────────────────────────────────────
log()  { echo -e "${BLUE}[INFO]${RESET} $*"; }
warn() { echo -e "${YELLOW}[WARN]${RESET} $*"; }
err()  { echo -e "${RED}[ERR]${RESET}  $*" >&2; }
ok()   { echo -e "${GREEN}[ OK ]${RESET} $*"; }

gh() {
  curl -s -H "Authorization: token $GH_TOKEN" \
       -H "Accept: application/vnd.github+json" \
       "$@"
}

vc() {
  curl -s -H "Authorization: Bearer $VC_TOKEN" \
       "$@"
}

latest_build_errors() {
  local proj_uid="$1"
  local proj_name="$2"

  # Get latest deployment for this project
  local dep
  dep=$(vc "$VC_API/v6/deployments?projectId=$proj_uid&limit=1" 2>/dev/null | \
        python3 -c "
import sys,json
d=json.load(sys.stdin)
deps=d.get('deployments',[])
if deps:
    dep=deps[0]
    print(dep.get('uid',''), dep.get('readyState',''), dep.get('url',''))
" 2>/dev/null)

  if [ -z "$dep" ]; then
    echo "  ${YELLOW}no deployments found${RESET}"
    return
  fi

  local uid state url
  uid=$(echo "$dep" | cut -d' ' -f1)
  state=$(echo "$dep" | cut -d' ' -f2)
  url=$(echo "$dep" | cut -d' ' -f3-)

  echo -e "  State: ${state} | URL: $url"

  # Only scan logs for ERROR or FAILING deployments
  if [[ "$state" != "ERROR" && "$state" != "READY" ]]; then
    return
  fi

  # Pull build logs via Vercel v2 events API
  local logs
  logs=$(vc "$VC_API/v2/deployments/$uid/events" 2>/dev/null | \
         python3 -c "
import sys,json,re
d=json.load(sys.stdin)
events=d if isinstance(d,list) else []
errors=[]
for e in events:
    if isinstance(e,dict) and e.get('type') in ('stderr','stdout'):
        text=e.get('payload',{}).get('text','')
        if text:
            # Look for error indicators
            if any(x in text.lower() for x in ['error','failed','failure','fatal','cannot find','module not found','enoent','emsg']):
                errors.append(text[:300])
for err in errors[:15]:
    print(err.replace('\n',' '))
" 2>/dev/null)

  if [ -n "$logs" ]; then
    echo -e "  ${RED}Build errors detected:${RESET}"
    echo "$logs" | while read -r line; do
      echo -e "    ${RED}›${RESET} ${line:0:200}"
    done
  else
    if [[ "$state" == "ERROR" ]]; then
      echo -e "  ${YELLOW}Deployment error but no parseable build log errors (check Vercel dashboard)${RESET}"
    else
      echo -e "  ${GREEN}No build errors${RESET}"
    fi
  fi
}

# ── Main ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  ctwebsiteco — Vercel Build Error Scanner${RESET}"
echo -e "${BOLD}  $(date -u +"%Y-%m-%d %H:%M UTC")${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo ""

# 1. Get all Vercel projects linked to ctwebsiteco GitHub repos
log "Fetching all Vercel projects..."
PROJECTS=$(vc "$VC_API/v6/projects?limit=50" 2>/dev/null | \
  python3 -c "
import sys,json,re
d=json.load(sys.stdin)
projects=d.get('projects',[])
ctgithub=[]
for p in projects:
    link=p.get('link',{}) or {}
    github=link.get('repo','')
    if github and 'ctwebsiteco' not in github.lower():
        # Try to find org from full name
        pass
    org=link.get('org','')
    # Check if it's ctwebsiteco (not team)
    if 'ctwebsiteco' in github.lower():
        ctgithub.append({'name':p['name'],'uid':p['id'],'github':github,'linked':True})
    elif link and not github:
        # Check if it's linked to a ctwebsiteco repo via the projects list
        full_name=link.get('repo','')
        if full_name:
            ctgithub.append({'name':p['name'],'uid':p['id'],'github':full_name,'linked':True})
print(json.dumps(ctgithub))
" 2>/dev/null)

echo "$PROJECTS" | python3 -c "
import sys,json
projects=json.load(sys.stdin)
print(f'Found {len(projects)} ctwebsiteco-linked Vercel projects')
for p in projects:
    print(f'  {p[\"name\"]:45} → {p[\"github\"]}')
" 2>/dev/null

echo ""

# Also get ALL projects and check github/org fields
ALL_PROJECTS=$(vc "$VC_API/v6/projects?limit=50" 2>/dev/null | \
  python3 -c "
import sys,json
d=json.load(sys.stdin)
projects=d.get('projects',[])
for p in projects:
    link=p.get('link',{}) or {}
    print(p['name'], '|', p['id'], '|', link.get('repo','?'), '|', link.get('org','?'))
" 2>/dev/null)

# 2. Check GitHub PRs across all ctwebsiteco repos
log "Checking GitHub PRs for blocked authors..."
REPOS=$(gh "$GH_API/orgs/$ORG/repos?per_page=100&sort=updated" 2>/dev/null | \
        python3 -c "
import sys,json
d=json.load(sys.stdin)
for r in d:
    print(r['full_name'])
" 2>/dev/null)

BAD_PR_COUNT=0
BAD_PRS=""
for repo in $REPOS; do
  prs=$(gh "$GH_API/repos/$repo/pulls?state=open&per_page=5" 2>/dev/null | \
        python3 -c "
import sys,json
prs=json.load(sys.stdin)
bad=[]
for pr in prs:
    author=pr.get('user',{}).get('login','')
    if author not in ('SeanConway102','dependabot[bot]','web-flow'):
        bad.append(f'#{pr[\"number\"]} by @{author}')
print(';'.join(bad))
" 2>/dev/null)
  if [ -n "$prs" ] && [ "$prs" != "None" ]; then
    IFS=';' read -ra BAD <<< "$prs"
    for b in "${BAD[@]}"; do
      if [ -n "$b" ]; then
        BAD_PRS="$BAD_PRS  $repo $b"$'\n'
        ((BAD_PR_COUNT++))
      fi
    done
  fi
done

if [ "$BAD_PR_COUNT" -gt 0 ]; then
  echo -e "${RED}⚠  5 PRs have non-SeanConway102 authors (may be blocked):${RESET}"
  echo -e "$BAD_PRS"
else
  ok "No problematic PR authors found"
fi

echo ""

# 3. Scan each Vercel project
echo -e "${BOLD}─── Vercel Deployments ───────────────────────────────${RESET}"
echo ""

ERROR_COUNT=0
WARN_COUNT=0

# Parse projects from the full list
echo "$ALL_PROJECTS" | while IFS='|' read -r name uid github org; do
  name=$(echo "$name" | xargs)
  uid=$(echo "$uid" | xargs)
  github=$(echo "$github" | xargs)
  org=$(echo "$org" | xargs)

  # Skip non-ctwebsiteco repos
  [[ "$github" != *"ctwebsiteco"* && "$github" != "?" && -n "$github" ]] && continue
  [[ "$github" == "?" ]] && continue

  echo -e "${BOLD}▶  $name${RESET}"
  echo -e "    GitHub: $github"

  # Get latest deployment state
  dep_info=$(vc "$VC_API/v6/deployments?projectId=$uid&limit=1" 2>/dev/null | \
    python3 -c "
import sys,json
d=json.load(sys.stdin)
deps=d.get('deployments',[])
if deps:
    dep=deps[0]
    print(dep.get('readyState','?'), dep.get('uid','?'), dep.get('url',''))
else:
    print('NO_DEPLOYMENTS')
" 2>/dev/null)

  state=$(echo "$dep_info" | cut -d' ' -f1)
  dep_uid=$(echo "$dep_info" | cut -d' ' -f2)
  dep_url=$(echo "$dep_info" | cut -d' ' -f3-)

  if [[ "$state" == "NO_DEPLOYMENTS" || -z "$state" ]]; then
    echo -e "    ${YELLOW}No deployments yet${RESET}"
    ((WARN_COUNT++))
    echo ""
    return
  fi

  echo -e "    State: $state | $dep_url"

  if [[ "$state" == "ERROR" ]]; then
    ((ERROR_COUNT++))
    # Pull v2 events for error details
    errors=$(vc "$VC_API/v2/deployments/$dep_uid/events" 2>/dev/null | \
      python3 -c "
import sys,json,re
d=json.load(sys.stdin)
events=d if isinstance(d,list) else []
err_lines=[]
for e in events:
    if isinstance(e,dict) and e.get('type') in ('stderr','stdout'):
        text=e.get('payload',{}).get('text','')
        if text:
            lower=text.lower()
            if any(x in lower for x in ['error','failed','failure','fatal','cannot find','enoent','emsg','exited with']):
                # Clean up ANSI codes and truncate
                clean=re.sub(r'\x1b\[[0-9;]*[a-zA-Z]','',text)
                err_lines.append(clean[:250].strip())
for l in err_lines[:10]:
    if l:
        print(l.replace('\n',' '))
" 2>/dev/null)
    if [[ -n "$errors" ]]; then
      echo -e "    ${RED}Errors:${RESET}"
      echo "$errors" | while read -r line; do
        [[ -z "$line" ]] && continue
        echo -e "      ${RED}›${RESET} ${line:0:220}"
      done
    else
      echo -e "    ${YELLOW}Error state but no parseable logs (check Vercel dashboard)${RESET}"
    fi
  elif [[ "$state" == "READY" ]]; then
    ok "Build successful"
  else
    echo -e "    ${YELLOW}Status: $state${RESET}"
    ((WARN_COUNT++))
  fi
  echo ""
done

# ── Summary ─────────────────────────────────────────────────────────────────
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Summary ($(date -u +"%H:%M UTC"))${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}✗  $ERROR_COUNT projects with ERROR deployments${RESET}"
else
  ok "No projects with ERROR deployments"
fi
if [ "$WARN_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}⚠  $WARN_COUNT projects with non-READY deployments${RESET}"
fi
if [ "$BAD_PR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}⚠  $BAD_PR_COUNT PRs with non-SeanConway102 authors${RESET}"
fi
echo ""
