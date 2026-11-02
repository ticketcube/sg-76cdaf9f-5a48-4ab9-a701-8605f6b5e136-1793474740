---
title: "Fans: Embeds are the station on onestowatch.com"
status: todo
priority: urgent
type: feature
tags: [fans, embed, launch]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 8
---

## Notes
Tasks 4 and 5 built `/embed/player` and `/embed/schedule`. Fans listen on onestowatch.com, not here, so these embeds are the fan product. They still need framing headers, a copy-paste snippet for the onestowatch.com team, and to work well at small sizes.

## Checklist
- [ ] In `next.config.mjs` headers, set `Content-Security-Policy: frame-ancestors 'self' https://onestowatch.com https://*.onestowatch.com` on `/embed/*` only; keep other pages unframeable
- [ ] Remove the placeholder `/old-path` redirect from `vercel.json`
- [ ] Transparent background option via `?bg=transparent`
- [ ] Add a page `/embed` (unlisted) with iframe snippets and a live preview of both widgets
- [ ] Player embed works one-handed on a phone at 100% width and at 360 × 120, and keeps playing while the onestowatch.com page scrolls
- [ ] Embeds use the shared `useNowPlaying` hook from task 6

## Acceptance
- Both widgets render inside an iframe on onestowatch.com and are refused on other origins.
