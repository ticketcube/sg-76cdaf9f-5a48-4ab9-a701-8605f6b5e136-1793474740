---
title: "Fans: Watch mode and live video takeover"
status: todo
priority: medium
type: feature
tags: [fans, video, aimc]
---

## Notes
Audio first, video when it earns it. Two cases: (1) Watch mode for recorded AIMC assets, where the track's AzuraCast custom field `has_video` is `"1"`; (2) a live venue show takeover later, via Mux or AWS IVS. Live venue shows air once and are never replayed unless the artist opts in. Depends on task 6.

## Checklist
- [ ] Server route `/api/video?asset={aimc_asset_id}` that calls AIMC with server-only `AIMC_API_URL` and `AIMC_API_KEY` and returns a short-lived MP4 proxy URL; stub the AIMC call behind one function with a TODO until the AIMC team confirms the route
- [ ] Show a "Watch" toggle on the now-playing card only when `now_playing.song.custom_fields.has_video` is `"1"`
- [ ] Play the proxy muted in a 16:9 frame starting at `elapsed`, while the radio audio keeps playing; re-sync when drift is over 2 seconds, with a fixed offset setting for stream delay
- [ ] Smooth transition between the audio-only state (artist art) and the video state
- [ ] 2 or 3 "Upcoming live shows" cards below the player (placeholder data in `otw-radio/config/live-shows.json`)

## Acceptance
- On a track with video, Watch shows the clip in step with the audio within 2 seconds.
- No AIMC key or S3 URL with long-lived credentials reaches the browser.
