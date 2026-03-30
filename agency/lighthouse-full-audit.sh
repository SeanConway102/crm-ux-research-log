#!/bin/bash
# CT Media — 1AM Lighthouse Audit (Info Gathering Only)
# Runs fresh Lighthouse on all client sites, saves results for me to review
# I decide what tickets to create/update — this script only gathers data

WORKSPACE="/root/.openclaw/workspace-agency"
CRM_API_KEY_FILE="$WORKSPACE/.crm-key"
CRM_URL="https://crm-api-1016182607730.us-east1.run.app"
LOGFILE="$WORKSPACE/memory/cron.log"
STATE_DIR="$WORKSPACE/memory/lh-audit"
REPOS_DIR="/root/repos"

SULLY_ID="fcc77e15-ea54-43ca-8e53-b1caa727a46f"
CHROME_PATH="/usr/bin/chromium-browser"
LIGHTHOUSE_FLAGS="--headless --no-sandbox --disable-dev-shm-usage --disable-gpu"
CRM_URL="https://crm-api-1016182607730.us-east1.run.app"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M')] [LH-AUDIT] $1"
  echo "$msg" | tee -a "$LOGFILE"
}

mkdir -p "$STATE_DIR"

run_lh() {
  local url=$1
  local output=$2
  lighthouse "$url" --output=json --output-path="$output" \
    --chrome-flags="$LIGHTHOUSE_FLAGS" 2>/dev/null
  [ -f "$output" ] && [ -s "$output" ]
}

log "=== Starting 1AM Lighthouse Audit (Info Gathering) ==="

AUDIT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="$STATE_DIR/audit-report-$AUDIT_DATE.md"
echo "# Lighthouse Audit Report — $(date '+%Y-%m-%d %H:%M UTC')" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Dynamically fetch sites from CRM
log "Fetching sites from CRM..."
SITES_JSON=$(curl -s -H "X-API-Key: $(cat "$WORKSPACE/.crm-key")" \
  "$CRM_URL/api/v1/sites?limit=100" 2>/dev/null)

SITES_COUNT=$(echo "$SITES_JSON" | jq '[.data[] | select(.vercel_project_id != null and .vercel_project_id != "null" and .url != null)] | length' 2>/dev/null)
log "Found $SITES_COUNT sites with Vercel project IDs"

for site_name in $(echo "$SITES_JSON" | jq -r '[.data[] | select(.vercel_project_id != null and .vercel_project_id != "null" and .url != null) | .name] | .[]'); do
  url=$(echo "$SITES_JSON" | jq -r --arg name "$site_name" '.data[] | select(.name == $name) | .url')
  
  log "Auditing: $site_name → $url"
  
  OUTPUT_FILE="$STATE_DIR/${site_name}-${AUDIT_DATE}.json"
  
  if ! run_lh "$url" "$OUTPUT_FILE"; then
    log "  FAILED: Lighthouse error for $site_name"
    echo "## $site_name — **FAILED TO AUDIT**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    continue
  fi
  
  # Extract scores
  perf=$(jq -r ".categories.performance.score * 100 | floor" "$OUTPUT_FILE" 2>/dev/null || echo "N/A")
  access=$(jq -r ".categories.accessibility.score * 100 | floor" "$OUTPUT_FILE" 2>/dev/null || echo "N/A")
  bp=$(jq -r ".categories.\"best-practices\".score * 100 | floor" "$OUTPUT_FILE" 2>/dev/null || echo "N/A")
  seo=$(jq -r ".categories.seo.score * 100 | floor" "$OUTPUT_FILE" 2>/dev/null || echo "N/A")
  lcp=$(jq -r ".audits.\"largest-contentful-paint\".displayValue // \"N/A\"" "$OUTPUT_FILE" 2>/dev/null)
  tbt=$(jq -r ".audits.\"total-blocking-time\".displayValue // \"N/A\"" "$OUTPUT_FILE" 2>/dev/null)
  fcp=$(jq -r ".audits.\"first-contentful-paint\".displayValue // \"N/A\"" "$OUTPUT_FILE" 2>/dev/null)
  
  perf_int=${perf:-0}
  
  log "  Scores — Perf: $perf, Access: $access, BP: $bp, SEO: $seo | LCP: $lcp, TBT: $tbt"
  
  # Determine status
  issues=()
  if [ "$perf_int" -lt 90 ]; then
    issues+=("Performance below 90: $perf")
  fi
  if [ -n "$access" ] && [ "$access" -lt 90 ]; then
    issues+=("Accessibility below 90: $access")
  fi
  if [ -n "$bp" ] && [ "$bp" -lt 100 ]; then
    issues+=("Best-Practices below 100: $bp")
  fi
  if [ -n "$seo" ] && [ "$seo" -lt 90 ]; then
    issues+=("SEO below 90: $seo")
  fi
  if echo "$lcp" | grep -qE "[0-9]+\.[0-9]+.*s" && (( $(echo "$lcp" | grep -oE "^[0-9]+\.[0-9]+" | head -1) > 2.5 2>/dev/null )); then
    issues+=("LCP high: $lcp (target: <2.5s)")
  fi
  
  # Write to report
  echo "## $site_name" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**URL:** $url" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Scores" >> "$REPORT_FILE"
  echo "- Performance: **$perf** $([ "$perf_int" -ge 90 ] && echo "✓" || echo "✗")" >> "$REPORT_FILE"
  echo "- Accessibility: **$access** $([ "$access" -ge 90 ] && echo "✓" || echo "✗")" >> "$REPORT_FILE"
  echo "- Best-Practices: **$bp** $([ "$bp" -ge 100 ] && echo "✓" || echo "✗")" >> "$REPORT_FILE"
  echo "- SEO: **$seo** $([ "$seo" -ge 90 ] && echo "✓" || echo "✗")" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Core Vitals" >> "$REPORT_FILE"
  echo "- FCP: $fcp" >> "$REPORT_FILE"
  echo "- LCP: $lcp" >> "$REPORT_FILE"
  echo "- TBT: $tbt" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  if [ ${#issues[@]} -gt 0 ]; then
    echo "### Issues Found" >> "$REPORT_FILE"
    for issue in "${issues[@]}"; do
      echo "- $issue" >> "$REPORT_FILE"
    done
    echo "" >> "$REPORT_FILE"
  else
    echo "### Status: ✓ All targets met — no ticket needed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
  fi
  
  # Save current scores
  echo "{\"perf\":$perf,\"access\":$access,\"bp\":$bp,\"seo\":$seo,\"lcp\":\"$lcp\",\"tbt\":\"$tbt\",\"fcp\":\"$fcp\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    > "$STATE_DIR/${site_name}-current.json"
  
  log ""
done

log "=== Audit Complete — Report saved to $REPORT_FILE ==="
echo "" >> "$LOGFILE"

# Cleanup old state files (keep last 2 days)
find "$STATE_DIR" -name "*.json" -mtime +2 -delete 2>/dev/null

# Notify via pending notification
cat > "$WORKSPACE/memory/pending-notifications.md" << EOF
# Lighthouse Audit Complete

Report saved: $REPORT_FILE

Please review the audit results and:
1. Create tickets for any sites below target
2. Assign tickets to Sully
3. Decide which tickets need immediate attention

Sites audited: $SITES_COUNT
EOF

log "Report available at: $REPORT_FILE"