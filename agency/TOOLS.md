# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### Browser (Visual)

**Playwright Skill installed** — `~/.openclaw/skills/playwright-scraper/` (from ClawHub)

Startup (after container restart):
```bash
export PATH=$PATH:/usr/local/sbin:/usr/sbin:/sbin
google-chrome --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-session &
sleep 2
```

Quick screenshot with installed skill:
```bash
cd ~/.openclaw/skills/playwright-scraper
SCREENSHOT_PATH=/root/screenshot.png node scripts/playwright-simple.js "URL"
# Or stealth (for anti-bot sites):
SCREENSHOT_PATH=/root/screenshot.png node scripts/playwright-stealth.js "URL"
```

Node module path: `NODE_PATH=/usr/lib/node_modules`

**Jina screenshot** (no browser needed, for public pages):
- `capture_screenshot_url` tool — returns base64 or URL

## Lighthouse

**Local:** Chromium .deb at `/usr/bin/google-chrome`, Lighthouse CLI at `/usr/bin/lighthouse`
```bash
CHROME_PATH=/usr/bin/chromium-browser lighthouse URL --output=json --output-path=/tmp/lh-report.json --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage --disable-gpu"
```

**Google PageSpeed API** (key stored at `~/.openclaw/workspace-agency/.pagespeed-key`):
```bash
curl -s "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL&strategy=mobile&key=$(cat ~/.openclaw/workspace-agency/.pagespeed-key)" | jq '.lighthouseResult.categories'
```
Note: API only returns `performance` category — for full scores use local Lighthouse CLI.
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
