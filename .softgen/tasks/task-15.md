---
title: "Staff: Station dashboard and lock the staff site"
status: todo
priority: urgent
type: feature
tags: [staff, dashboard, launch]
created_by: claude
created_at: 2026-11-02T20:05:00Z
position: 7
---

## Notes
onestowatch.live is the staff site. Fans listen on onestowatch.com through the embeds, and AzuraCast runs at radio.onestowatch.live. No database at launch, so lock the site with one shared password and keep the dashboard read-only. Real staff accounts and editing come with Supabase (task 12).

## Checklist
- [ ] Add `src/middleware.ts` with HTTP Basic Auth using server-only `STAFF_PASSWORD`, applied to every route except `/embed/*`, the APIs the embeds use (`/api/nowplaying`, `/api/schedule`, `/api/video`), and static assets
- [ ] Add `X-Robots-Tag: noindex` to everything except the embeds
- [ ] Replace the public home page with a staff dashboard: on air now (track, art, live host), listener count, today's grid from `schedule.json` with the current block highlighted, and AzuraCast's own upcoming schedule from `GET {AZURACAST_URL}/api/station/{id}/schedule` via a server route, so staff can spot a mismatch
- [ ] "Embeds" panel with live previews and copy-paste iframe snippets for onestowatch.com
- [ ] Links out to the AzuraCast admin (radio.onestowatch.live), the docs in `otw-radio/docs/`, and the AIMC console
- [ ] Health checks: AzuraCast reachable, stream up, AIMC route reachable, shown as green or red

## Acceptance
- Visiting onestowatch.live asks for the staff password; the embeds still load on onestowatch.com without one.
- No AzuraCast API key reaches the browser.
