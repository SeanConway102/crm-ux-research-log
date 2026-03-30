# Codebase Research — 2026-03-29

## Architecture

### Stack
- Next.js 16 (latest, App Router)
- Tailwind CSS 4 + shadcn/ui components
- Vercel hosting + Vercel blob storage for images
- Sanity CMS (some sites)
- @next/third-parties (Google Analytics, Maps, YouTube embeds)
- recharts (charting — heavy dependency)

### Repos (cloned to ~/repos/)
- base-template — shared template (has Sanity, shadcn/ui, Tailwind 4)
- crm-frontend — CRM app (has Sanity, recharts, resend)
- v0-build-a-and-b-website — A&B Entertainment (best performer: 92)
- v0-3-c-s-tavern-website-jg — 3Cs Tavern (62)
- v0-fairway-irrigation-website — Fairway Irrigation (55)
- v0-salisbury-kitchen — Salisbury Kitchen (43)
- v0-li-zhai-art-studio — Lizhai Art (57)
- v0-pals-power-washing-website — Pals Power Washing (61)
- v0-gutter-website-rebuild — AA Gutters (68)
- v0-tax-career-advisor-website — Tax Career Advisor (40)

## Performance Patterns

### Best performers (80+):
- **v0-build-a-and-b-website (92)**: Minimal JS, no Sanity, tiny public/ (48KB), simple brochure. NO sharp installed, but barely any images to optimize.
- **v0-gutter-website-rebuild (68)**: Has `unoptimized: true`... wait no. Let me re-check.

### Critical: `unoptimized: true` kills performance
- **CRM Frontend (36)**: `unoptimized: true` in next.config
- **salisburykitchen (43)**: `unoptimized: true` in next.config + no sharp installed + 3MB raw images

### Image Optimization Issues
1. `unoptimized: true` disables Next.js image optimization entirely
2. sharp is NOT automatically installed — must add `"sharp": "^0.34.5"` to dependencies
3. Vercel blob storage domains need `remotePatterns` in next.config
4. Many sites use unsplash images via remotePatterns but don't optimize them

### Heavy Dependencies
- **@next/third-parties**: Loads Google Analytics, Maps, YouTube — nearly EVERY site has this
- **recharts**: Charting library — in most sites (even simple brochure sites!)
- **vercel/analytics**: Lightweight, fine
- **Sanity**: CMS — only base-template, crm-frontend, v0-gutter-website-rebuild

## Next.js Image Config Best Practice
```js
images: {
  formats: ["image/avif", "image/webp"],  // AVIF first, WebP fallback
  deviceSizes: [640, 750, 768, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30,  // 30 days
  // NO unoptimized: true
  // Add remotePatterns for any external image domains
}
```

## Fix Priority

### Priority 1 (remove unoptimized flag):
1. salisburykitchen — `unoptimized: true` + no sharp + 3MB images
2. crm-frontend — `unoptimized: true` 

### Priority 2 (install sharp, configure images):
3. v0-salisbury-kitchen — install sharp
4. v0-build-a-and-b-website — install sharp proactively
5. v0-gutter-website-rebuild — check if sharp installed

### Priority 3 (reduce JS bundle):
6. taxcareeradvisor (40) — has recharts, 40+ redirect rules
7. fairwayirrigation (55) — has recharts
8. palspowerwashing (61) — has recharts
