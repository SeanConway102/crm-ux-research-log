---
name: site-files
description: Store and retrieve files for client sites using the CRM attachment API
---

# Site File Storage

Store and retrieve files (logos, screenshots, reports, configs, assets) for client sites using the CRM attachment API.

## How It Works

Sites don't have direct attachment endpoints. Files are stored against the **company** that owns the site. Use a naming convention to associate files with specific sites.

### File Naming Convention

Prefix filenames with the site name or domain:
- `palspowerwashing-logo.png`
- `fairwayirrigation-lighthouse-2026-03-30.json`
- `ctpolitics-screenshot-homepage.png`
- `3cstavern-design-brief.pdf`

## API Reference

Base URL: `https://crm-api-1016182607730.us-east1.run.app`
Auth: `X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)`

### Step 1: Find the site and its company

```bash
# Search for a site by name or URL
curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/sites?search=SITE_NAME" \
  | jq '.data[] | {id: .id, name: .name, url: .url, company_id: .company_id}'

# Or list all sites
curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/sites?limit=100" \
  | jq '.data[] | {id: .id, name: .name, url: .url, company_id: .company_id}'
```

### Step 2: Upload a file to the company

```bash
# Upload file (use the company_id from the site)
curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  -F "file=@/path/to/sitename-filename.ext" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/companies/COMPANY_ID/attachments"
```

### Step 3: List files for a site

```bash
# List all attachments on the company, filter by site prefix in filename
curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/companies/COMPANY_ID/attachments" \
  | jq '.data[] | {id: .id, original_filename: .original_filename, content_type: .content_type, size_bytes: .size_bytes, created_at: .created_at}'
```

### Step 4: Download a file

```bash
# Download by attachment ID (follows redirect to storage URL)
curl -sL -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/attachments/ATTACHMENT_ID" -o filename.ext
```

### Step 5: Delete a file

```bash
curl -s -X DELETE -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/attachments/ATTACHMENT_ID"
```

## Common Workflows

### Save a Lighthouse report for a site
```bash
# Run audit, save JSON
lighthouse https://example.com --output=json --output-path=/tmp/sitename-lighthouse.json \
  --chrome-flags="--headless --no-sandbox"

# Find the site's company
COMPANY_ID=$(curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/sites?search=sitename" \
  | jq -r '.data[0].company_id')

# Upload
curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  -F "file=@/tmp/sitename-lighthouse.json" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/companies/$COMPANY_ID/attachments"
```

### Save a screenshot for a site
```bash
# Take screenshot via Jina or Playwright, then upload with site-prefixed filename
curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  -F "file=@/tmp/sitename-screenshot.png" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/companies/$COMPANY_ID/attachments"
```

### Save a design brief or asset
```bash
curl -s -H "X-API-Key: $(cat ~/.openclaw/workspace-agency/.crm-key)" \
  -F "file=@/tmp/sitename-design-brief.pdf" \
  "https://crm-api-1016182607730.us-east1.run.app/api/v1/companies/$COMPANY_ID/attachments"
```

## Notes

- Attachments support any file type — images, PDFs, JSON, text, etc.
- Files are stored in cloud storage with public URLs (redirect on download)
- The `original_filename` is preserved so you can search/filter by name convention
- Sites without a `company_id` need one created first — use `POST /api/v1/companies`
- Also works with deals and tickets: `POST /api/v1/deals/ID/attachments`, `POST /api/v1/tickets/ID/attachments`
