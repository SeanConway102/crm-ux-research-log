---
name: stv-integration
description: Integrate a client site with SatelliteTV Feed (admin.satellitetvfeed.net) — live streaming, on-demand videos, and radio
disable-model-invocation: true
argument-hint: <station-name>
---

# /stv-integration

Integrate a Next.js client site with the SatelliteTV Feed platform at `admin.satellitetvfeed.net`. Adds live streaming, on-demand video library, radio, and a server-side stream proxy.

## Arguments

- `<station-name>` — the STV station identifier (e.g., `ctpolitics`, `ct-politics`)

**Important:** The station name may differ between endpoints. The feed/video endpoints use the station name without hyphens (e.g., `ctpolitics`), while the live stream key may use hyphens (e.g., `ct-politics`). Verify both before integrating.

## Reference Implementation

See `projects/ctpolitics-tv` for a complete working example.

## STV Public API Endpoints

All endpoints are public (no authentication required). Base URL: `https://admin.satellitetvfeed.net`

Source code for the API server is at `C:/dev/ClientApp` — consult `routes/index.js`, `routes/WebApp.js`, and `routes/Public/` for endpoint details.

### Feed & Content

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/{station}/roku.json` | GET | JSON array of `{ name, videos[] }` — categorized videos, "Live" category always first |
| `/{station}/RokuFeed.json` | GET | 302 redirect to S3 `feed.json` — full Roku-compatible feed |
| `/WebApp/GetSFVs/{station}` | GET | JSON array of all short-form videos with metadata |
| `/WebApp/Channel/{station}` | GET | Full HTML on-demand channel page (for external links/iframes) |
| `/{station}/liveposter` | GET | 302 redirect to live poster image (PNG) |
| `/{station}/channelsplash` | GET | 302 redirect to channel splash banner (PNG) |

### Live Streaming

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/currentStreamURL.m3u8?station={station}` | GET | HLS M3U8 playlist — **use this for live player** |
| `/currentStreamURL.live?station={station}` | GET | Redirect to live MP4 stream |
| `/live/player/{streamKey}/live.m3u8` | GET | HLS playlist from playlist server (stream key may differ from station name) |
| `/{station}/LiveEmbed` | GET | Embeddable HTML live player page |
| `/{station}/LiveEmbed.js` | GET | JavaScript embed script for live player |

### Radio

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/{station}/Stream?radio=true` | GET | Audio-only radio stream page |

### Other

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/value/{station}/{name}` | GET | Plain text custom value from station database |
| `/{station}/{menu}/Menu.json` | GET | Menu/navigation JSON from MongoDB |

### Content Storage

Videos, thumbnails, and feed JSON are stored on DigitalOcean Spaces:
- Base: `https://stvstore.nyc3.digitaloceanspaces.com/television/{station}/`
- CDN: `https://stvstore.nyc3.cdn.digitaloceanspaces.com/television/{station}/`
- Feed: `.../feed/feed.json`
- Content: `.../content/{filename}.mp4` and `.../content/{filename}.jpg`

## Video Data Shape

```typescript
interface STVVideo {
  id: string;
  title: string;
  shortDescription?: string;
  thumbnail?: string;          // URL to thumbnail image
  tags?: string[];             // Used as category names (may contain \n, trim these)
  content: {
    dateAdded: string;         // ISO date or unix timestamp
    duration?: number;         // seconds
    videos: {
      url: string;             // MP4 URL
      quality: string;         // "HD", "SD"
      videoType: string;       // "MP4"
    }[];
  };
}
```

## Steps

### 1. Add environment variable

Add to `.env.local`:
```
STV_STATION_ID={station-name}
```

### 2. Create types file — `lib/stv-types.ts`

```typescript
export interface STVFeed {
  providerName?: string;
  categories?: STVCategory[];
  shortFormVideos?: STVVideo[];
}

export interface STVCategory {
  name: string;
  query: string;
  order: string;
}

export interface STVVideo {
  id: string;
  title: string;
  shortDescription?: string;
  thumbnail?: string;
  tags?: string[];
  content: {
    dateAdded: string;
    duration?: number;
    videos: {
      url: string;
      quality: string;
      videoType: string;
    }[];
  };
}
```

### 3. Create API client — `lib/stv-api.ts`

```typescript
import type { STVVideo, STVCategory } from "./stv-types";

const STV_STATION = process.env.STV_STATION_ID || "REPLACE_ME";
const STV_BASE = "https://admin.satellitetvfeed.net";
const FETCH_TIMEOUT = 10000;

export function getStreamUrl(): string {
  return `${STV_BASE}/CurrentStreamURL.m3u8?station=${STV_STATION}`;
}

export function getPlayerUrl(): string {
  return `${STV_BASE}/WebApp/Channel/${STV_STATION}`;
}

export function getRadioUrl(): string {
  return `${STV_BASE}/${STV_STATION}/Stream?radio=true`;
}

export async function getVideos(): Promise<STVVideo[]> {
  try {
    const res = await fetch(`${STV_BASE}/WebApp/GetSFVs/${STV_STATION}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as STVVideo[];
    if (!Array.isArray(data)) return [];
    return data
      .filter((v) => {
        const tags = v.tags?.map((t) => t.replace("\n", "").trim().toLowerCase()) ?? [];
        return !tags.includes("live");
      })
      .sort((a, b) =>
        new Date(b.content.dateAdded).getTime() - new Date(a.content.dateAdded).getTime()
      );
  } catch {
    return [];
  }
}

export async function getCategoriesWithVideos(): Promise<{ name: string; videos: STVVideo[] }[]> {
  try {
    const res = await fetch(`${STV_BASE}/${STV_STATION}/roku.json`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { name: string; videos: STVVideo[] }[];
    if (!Array.isArray(data)) return [];
    return data.filter((c) => c.name && c.videos?.length > 0);
  } catch {
    return [];
  }
}

export async function getCategories(): Promise<STVCategory[]> {
  const cats = await getCategoriesWithVideos();
  return cats.map((c) => ({ name: c.name, query: c.name, order: "manual" }));
}
```

### 4. Create stream proxy — `app/api/stream/route.ts`

The live player needs a server-side proxy to avoid CORS issues. This route fetches the M3U8 playlist and extracts the MP4 URL:

```typescript
import { getStreamUrl } from "@/lib/stv-api";

export async function GET() {
  const m3u8Url = getStreamUrl();
  try {
    const res = await fetch(m3u8Url, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return Response.json({ url: null, type: "offline" });

    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const mediaUrl = lines.find(
      (l) => !l.startsWith("#") && (l.startsWith("http") || l.endsWith(".mp4") || l.endsWith(".ts"))
    );
    const isVod = text.includes("#EXT-X-ENDLIST");

    if (mediaUrl) {
      return Response.json({ url: mediaUrl, type: isVod ? "vod" : "live", m3u8: m3u8Url });
    }
    return Response.json({ url: null, type: "offline" });
  } catch {
    return Response.json({ url: null, type: "offline" });
  }
}
```

### 5. Add image domains to `next.config.ts`

STV serves thumbnails and content from these domains:

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "stvstore.nyc3.digitaloceanspaces.com" },
    { protocol: "https", hostname: "stvstore.nyc3.cdn.digitaloceanspaces.com" },
    { protocol: "https", hostname: "admin.satellitetvfeed.net" },
  ],
},
```

### 6. Build video components

Reference `projects/ctpolitics-tv/components/` for working implementations:

- **`video-player.tsx`** — Live TV player (no native controls, auto-play muted, click to unmute, LIVE badge, channel bug watermark). Fetches stream from `/api/stream` proxy.
- **`video-card.tsx`** — On-demand video card with thumbnail, modal playback, category badge.
- **`video-grid.tsx`** — Filterable grid with category buttons + "Load More" pagination.

### 7. Wire up pages

**Homepage** — call `getVideos()` server-side, render with VideoCard components:
```typescript
const videos = await getVideos();
// Render videos.slice(0, 8) as VideoCard grid
```

**Media/Videos page** — call both `getVideos()` and `getCategoriesWithVideos()`:
```typescript
const [videos, categories] = await Promise.all([getVideos(), getCategoriesWithVideos()]);
const categoryNames = categories.map((c) => c.name);
// Render <VideoGrid videos={videos} categories={categoryNames} />
```

### 8. Add links to navigation/footer

- **Watch On Demand:** `https://admin.satellitetvfeed.net/WebApp/Channel/{station}`
- **Watch Live:** Link to live player or use VideoPlayer component
- **Radio:** `https://admin.satellitetvfeed.net/{station}/Stream?radio=true`

## Verification

```bash
# Test endpoints before integrating (replace STATION with actual name)
curl -s -o /dev/null -w "%{http_code}" "https://admin.satellitetvfeed.net/WebApp/GetSFVs/STATION"    # → 200
curl -s -o /dev/null -w "%{http_code}" "https://admin.satellitetvfeed.net/STATION/roku.json"          # → 200
curl -s -o /dev/null -w "%{http_code}" "https://admin.satellitetvfeed.net/currentStreamURL.m3u8?station=STATION"  # → 200

# Test the stream key separately (may use hyphens)
curl -s -o /dev/null -w "%{http_code}" "https://admin.satellitetvfeed.net/live/player/STREAM-KEY/live.m3u8"  # → 200 or 404

# After integration
pnpm dev
# → Homepage shows video thumbnails from STV
# → /media shows categorized video grid
# → Live player connects or shows "offline" gracefully
# → /api/stream returns { url, type } JSON
```

## Common Gotchas

1. **Station name vs stream key** — feed endpoints use `ctpolitics` but live stream may use `ct-politics`. Test both.
2. **Tags contain `\n`** — STV video tags may contain literal newlines. Always `.replace("\n", "").trim()` before comparing.
3. **Videos tagged "live"** — filter these out of on-demand listings (`!tags.includes("live")`).
4. **CORS on M3U8** — browsers can't fetch the M3U8 directly due to CORS. Use the `/api/stream` server-side proxy.
5. **dateAdded format varies** — some videos use ISO strings, others use unix timestamps. `new Date()` handles both.
6. **Revalidation** — set `next: { revalidate: 300 }` (5 min) on feed fetches. Don't hit the API on every request.
7. **Autoplay policy** — browsers require muted autoplay. The video player must start muted and let the user click to unmute.
