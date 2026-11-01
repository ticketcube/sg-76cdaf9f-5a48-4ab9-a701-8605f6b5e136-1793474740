---
title: "Fans: Fix now-playing, stream and schedule wiring"
status: todo
priority: urgent
type: bug
tags: [fans, player, azuracast, launch]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 6
---

## Notes
Task 1 is marked done, but the wiring is broken. `AudioPlayer.tsx` sets `nowPlayingUrl` to the MP3 stream instead of the now-playing API, both URLs are hardcoded, `embed/player.tsx` hardcodes its own URL, and `/api/schedule` reads `config/schedule.json` at the repo root, which does not exist (the file is `otw-radio/config/schedule.json`). Fans must never see the AzuraCast UI, only the stream and data through this site.

## Checklist
- [ ] Add a server route `/api/nowplaying` that fetches `{AZURACAST_URL}/api/nowplaying/{AZURACAST_STATION_ID}` server-side, caches it for 10 seconds, and returns only the fields the site uses
- [ ] Point the sticky player and `/embed/player` at `/api/nowplaying` (one shared hook, e.g. `useNowPlaying`) and poll every 15 seconds
- [ ] Take stream URLs from the now-playing response (`station.hls_url`, `station.mounts`), play HLS with hls.js and fall back to the MP3 mount
- [ ] Remove every hardcoded AzuraCast URL; use `NEXT_PUBLIC_AZURACAST_URL` and `NEXT_PUBLIC_STATION_SHORTCODE` only where the browser truly needs them
- [ ] Fix `/api/schedule` to read `otw-radio/config/schedule.json`
- [ ] When AzuraCast is unreachable, show "Reconnecting…" and keep retrying, never a blank player

## Acceptance
- The player shows the real artist and title and plays audio on desktop and mobile Safari.
- `/schedule` and `/embed/schedule` load the grid without a 500.
- No AzuraCast API key or admin URL appears in client code or network requests.
