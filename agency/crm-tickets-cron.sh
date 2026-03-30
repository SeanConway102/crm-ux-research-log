#!/bin/bash
# CT Media CRM — ticket check at :00 every hour
# Monitors Sully's ticket queue and logs for heartbeat to act on

WORKSPACE="/root/.openclaw/workspace-agency"
CRM_API_KEY_FILE="$WORKSPACE/.crm-key"
CRM_URL="https://crm-api-1016182607730.us-east1.run.app"
FRONTEND_URL="https://v0-crm-frontend-build-peach.vercel.app"
LOGFILE="$WORKSPACE/memory/cron.log"
NOTIFY_FILE="$WORKSPACE/memory/pending-tickets.md"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M')] $1"
  echo "$msg" | tee -a "$LOGFILE"
}

# === Health Checks ===
api_health=$(curl -s "$CRM_URL/health" | jq -r '.status // "error"')
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
log "API health: $api_health | Frontend: $frontend_status"

# === Ticket Queue (Sully = fcc77e15-ea54-43ca-8e53-b1caa727a46f) ===
TICKET_RESPONSE=$(curl -s -H "X-API-Key: $(cat "$CRM_API_KEY_FILE")" \
  "$CRM_URL/api/v1/tickets?assigned_to=fcc77e15-ea54-43ca-8e53-b1caa727a46f&limit=100" 2>/dev/null)

if echo "$TICKET_RESPONSE" | jq -e '.error' >/dev/null 2>&1; then
  log "Ticket API error: $(echo "$TICKET_RESPONSE" | jq -r '.error.message')"
else
  # Filter to actionable tickets only
  open_tickets=$(echo "$TICKET_RESPONSE" | jq '[.data[] | select(.status == "Backlog" or .status == "To Do")]' 2>/dev/null)
  open_count=$(echo "$open_tickets" | jq 'length' 2>/dev/null || echo "0")
  high_priority=$(echo "$open_tickets" | jq '[.[] | select(.priority == "high" or .priority == "urgent")]' 2>/dev/null)
  high_count=$(echo "$high_priority" | jq 'length' 2>/dev/null || echo "0")
  urgent_count=$(echo "$high_priority" | jq '[.[] | select(.priority == "urgent")] | length' 2>/dev/null || echo "0")

  log "Open tickets: $open_count | High/Urgent: $high_count"

  # Write high-priority tickets to notification file for heartbeat to act on
  if [ "$high_count" -gt 0 ]; then
    timestamp=$(date '+%Y-%m-%d %H:%M UTC')
    echo "## $timestamp — $high_count high/urgent ticket(s)" > "$NOTIFY_FILE"
    echo "" >> "$NOTIFY_FILE"
    echo "$high_priority" | jq -r '.[] | "- **[\(.priority)]** \(.subject) — ID: \(.id)"' >> "$NOTIFY_FILE"
    echo "" >> "$NOTIFY_FILE"
    log "High-priority tickets written to pending-tickets.md"
  else
    rm -f "$NOTIFY_FILE"
  fi

  if [ "$urgent_count" -gt 0 ]; then
    log "URGENT: $urgent_count urgent ticket(s)"
  fi
fi

log "=== Ticket Check Complete ==="
echo "" >> "$LOGFILE"
