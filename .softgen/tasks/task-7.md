---
title: "Fans: Now-playing card on the home page"
status: todo
priority: urgent
type: feature
tags: [fans, player, launch, licensing]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 7
---

## Notes
Depends on task 6. Licensing rule: the station must not publish advance song lists, so never show the title of the next track (`playing_next`). Recently played is fine.

## Checklist
- [ ] Large now-playing card: album art, artist, title, and a progress bar from `elapsed` and `duration`
- [ ] LIVE badge with `live.streamer_name` when `live.is_live` is true; otherwise show the current block name, e.g. "OTW WEEKLY FEATURES: ARTIST INTERVIEW"
- [ ] "Recently played" list of the last 5 tracks from `song_history`
- [ ] "Up next" shows the next programme block from `schedule.json` (e.g. "Noon: Guest Curator Playlist"), never the next song
- [ ] Listener count from `listeners.current` (hide it below 10)
- [ ] "Get tickets" link on the card when the artist has one in `otw-radio/config/artists.json` (see task 11)

## Acceptance
- The home page always shows what is on air now, and updates within 15 seconds of a track change.
- No future song titles appear anywhere on the site.
