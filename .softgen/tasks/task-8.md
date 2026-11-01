---
title: "Fans: Make the embeds safe to frame on onestowatch.com"
status: todo
priority: high
type: feature
tags: [fans, embed, launch]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 8
---

## Notes
Tasks 4 and 5 built `/embed/player` and `/embed/schedule`. They still need framing headers and a copy-paste snippet for the onestowatch.com team.

## Checklist
- [ ] In `next.config.mjs` headers, set `Content-Security-Policy: frame-ancestors 'self' https://onestowatch.com https://*.onestowatch.com` on `/embed/*` only; keep other pages unframeable
- [ ] Remove the placeholder `/old-path` redirect from `vercel.json`
- [ ] Transparent background option via `?bg=transparent`
- [ ] Add a page `/embed` (unlisted) with iframe snippets and a live preview of both widgets
- [ ] Embeds use the shared `useNowPlaying` hook from task 6

## Acceptance
- Both widgets render inside an iframe on onestowatch.com and are refused on other origins.
