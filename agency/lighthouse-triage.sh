#!/bin/bash
# CT Media — Lighthouse Performance Triage at 1AM
# Finds new Lighthouse result tickets, analyzes scores, updates with findings
# Runs after midnight audit (typically ~12am), finds issues needing attention

WORKSPACE="/root/.openclaw/workspace-agency"
CRM_API_KEY_FILE="$WORKSPACE/.crm-key"
CRM_URL="https://crm-api-1016182607730.us-east1.run.app"
LOGFILE="$WORKSPACE/memory/cron.log"
STATE_FILE="$WORKSPACE/memory/lighthouse-triage-state.json"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M')] [LH-TRIAGE] $1"
  echo "$msg" | tee -a "$LOGFILE"
}

# Read last run time (ISO8601)
last_run=$(jq -r '.last_run // empty' "$STATE_FILE" 2>/dev/null)
now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Default to yesterday if no state
if [ -z "$last_run" ]; then
  last_run=$(date -u -d "yesterday" +%Y-%m-%dT00:00:00Z)
fi

log "Running triage for tickets created since $last_run"

# Fetch performance category tickets created since last run
# Using the tickets endpoint filtered by category=performance and status=Backlog
TICKETS=$(curl -s -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
  "$CRM_URL/api/v1/tickets?category=performance&status=Backlog&limit=100" 2>/dev/null)

if echo "$TICKETS" | jq -e '.error' >/dev/null 2>&1; then
  log "API error: $(echo "$TICKETS" | jq -r '.error.message')"
  exit 1
fi

# Get all ticket IDs and filter by created_at > last_run
# The API returns tickets in .data with created_at fields
ticket_count=$(echo "$TICKETS" | jq '.data | length' 2>/dev/null || echo "0")
log "Found $ticket_count performance tickets in Backlog"

new_tickets=$(echo "$TICKETS" | jq --arg last_run "$last_run" \
  '[.data[] | select(.created_at > $last_run)]' 2>/dev/null)
new_count=$(echo "$new_tickets" | jq 'length' 2>/dev/null || echo "0")

log "New tickets since last run: $new_count"

if [ "$new_count" -eq 0 ]; then
  log "No new Lighthouse tickets to triage"
  echo "{\"last_run\": \"$now\"}" > "$STATE_FILE"
  exit 0
fi

# Analyze each new ticket
triage_results=()
high_count=0
medium_count=0

while IFS= read -r ticket; do
  id=$(echo "$ticket" | jq -r '.id')
  subject=$(echo "$ticket" | jq -r '.subject')
  description=$(echo "$ticket" | jq -r '.description')
  priority=$(echo "$ticket" | jq -r '.priority')
  
  log "Processing: $subject (ID: $id)"
  
  # Parse scores from description
  # Pattern: "Performance XX, Accessibility XX, Best-Practices XX, SEO XX"
  perf=$(echo "$description" | grep -oP 'Performance \K\d+' | head -1)
  access=$(echo "$description" | grep -oP 'Accessibility \K\d+' | head -1)
  bp=$(echo "$description" | grep -oP 'Best-Practices \K\d+' | head -1)
  seo=$(echo "$description" | grep -oP 'SEO \K\d+' | head -1)
  
  # Also check for Core Vitals
  fcp=$(echo "$description" | grep -oP 'FCP \K[\d.]+' | head -1)
  lcp=$(echo "$description" | grep -oP 'LCP \K[\d.]+' | head -1)
  tbt=$(echo "$description" | grep -oP 'TBT \K[\d.]+' | head -1)
  
  # Determine severity
  issues=()
  
  if [ -n "$perf" ] && [ "$perf" -lt 90 ]; then
    issues+=("Performance below target: $perf (target: 90)")
  fi
  if [ -n "$access" ] && [ "$access" -lt 90 ]; then
    issues+=("Accessibility below target: $access (target: 90)")
  fi
  if [ -n "$bp" ] && [ "$bp" -lt 100 ]; then
    issues+=("Best-Practices below target: $bp (target: 100)")
  fi
  if [ -n "$seo" ] && [ "$seo" -lt 90 ]; then
    issues+=("SEO below target: $seo (target: 90)")
  fi
  
  # Check Core Vitals thresholds (use awk to compare floats)
  if [ -n "$lcp" ] && [ "$(echo "$lcp 2.5" | awk '{print ($1 > $2) ? 1 : 0}')" = "1" ]; then
    issues+=("LCP high: ${lcp}s (target: <2.5s)")
  fi
  if [ -n "$tbt" ] && [ "$(echo "$tbt 3" | awk '{print ($1 > $2) ? 1 : 0}')" = "1" ]; then
    issues+=("TBT high: ${tbt}s (target: <3s)")
  fi
  if [ -n "$fcp" ] && [ "$(echo "$fcp 2" | awk '{print ($1 > $2) ? 1 : 0}')" = "1" ]; then
    issues+=("FCP high: ${fcp}s (target: <2s)")
  fi
  
  if [ ${#issues[@]} -gt 0 ]; then
    # Build triage findings comment
    findings="## Lighthouse Triage Findings\n\n"
    findings+="Analyzed at 1AM. Found ${#issues[@]} issue(s):\n\n"
    
    for issue in "${issues[@]}"; do
      findings+="- **$issue**\n"
    done
    
    findings+="\n### Recommended Actions\n\n"
    
    # Add specific actions based on issues found
    if [[ " ${issues[*]} " =~ "Performance" ]]; then
      findings+="1. Verify sharp is installed with next/image AVIF+WebP support\n"
      findings+="2. Audit image compression quality and sizes\n"
      findings+="3. Check for render-blocking JS\n"
      findings+="4. Review JS bundle sizes and implement code splitting\n"
    fi
    if [[ " ${issues[*]} " =~ "Accessibility" ]]; then
      findings+="1. Add alt text to all images\n"
      findings+="2. Ensure form inputs have associated labels\n"
      findings+="3. Check color contrast ratios (4.5:1 minimum)\n"
      findings+="4. Add skip-to-content link\n"
    fi
    if [[ " ${issues[*]} " =~ "Best-Practices" ]]; then
      findings+="1. Check browser console for errors\n"
      findings+="2. Verify security headers present\n"
      findings+="3. Look for deprecated APIs\n"
    fi
    if [[ " ${issues[*]} " =~ "SEO" ]]; then
      findings+="1. Improve meta descriptions\n"
      findings+="2. Add Open Graph tags\n"
      findings+="3. Check sitemap.xml\n"
    fi
    if [[ " ${issues[*]} " =~ "LCP high" ]] || [[ " ${issues[*]} " =~ "FCP high" ]]; then
      findings+="- Optimize hero images (target <200KB)\n"
      findings+="- Implement lazy loading for below-fold images\n"
    fi
    if [[ " ${issues[*]} " =~ "TBT high" ]]; then
      findings+="- Code-split JS bundles\n"
      findings+="- Lazy-load heavy components\n"
      findings+="- Defer non-critical JS\n"
    fi
    
    findings+="\n### Ticket Priority\n\n"
    
    # Determine new priority
    severity="medium"
    if [ -n "$perf" ] && [ "$perf" -lt 50 ]; then
      severity="high"
    elif [ -n "$lcp" ] && [ "$(echo "$lcp 5" | awk '{print ($1 > $2) ? 1 : 0}')" = "1" ]; then
      severity="high"
    elif [ -n "$perf" ] && [ "$perf" -lt 70 ]; then
      severity="medium"
    elif [ ${#issues[@]} -gt 2 ]; then
      severity="medium"
    fi
    
    findings+="Current priority: $priority → Suggested: **$severity**\n"
    
    # Post comment on ticket
    comment_result=$(curl -s -X POST \
      -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
      -H "Content-Type: application/json" \
      "$CRM_URL/api/v1/tickets/$id/comments" \
      -d "$(jq -n --arg body "$findings" '{body: $body}')" 2>/dev/null)
    
    if echo "$comment_result" | jq -e '.error' >/dev/null 2>&1; then
      log "Failed to post comment on $id"
    else
      log "Posted triage findings to ticket $id"
    fi
    
    # Update priority if severity is higher
    if [ "$severity" = "high" ]; then
      ((high_count++))
      curl -s -X PUT \
        -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
        -H "Content-Type: application/json" \
        "$CRM_URL/api/v1/tickets/$id" \
        -d '{"priority": "high"}' >/dev/null 2>&1
      log "Elevated $id to high priority"
    elif [ "$severity" = "medium" ]; then
      ((medium_count++))
    fi
    
    triage_results+=("$subject: $severity")
  else
    log "No action needed for: $subject"
  fi
  
done < <(echo "$new_tickets" | jq -c '.[]')

# Log summary
log "Triage complete: $new_count new, $high_count elevated to high, $medium_count medium"
for result in "${triage_results[@]}"; do
  log "  - $result"
done

# Update state
echo "{\"last_run\": \"$now\"}" > "$STATE_FILE"
log "=== Lighthouse Triage Complete ==="
echo "" >> "$LOGFILE"