
---
title: OTW Radio Web Player
status: in_progress
priority: urgent
type: feature
tags: [design-system, radio, live-event]
created_by: agent
created_at: 2026-10-30T04:41:00Z
---

## Vision
OTW Radio is the always-on home for the Ones To Watch roster. A 24/7 audio-first internet station with a dedicated web player, programming grid, and dynamic video integration for live artist premieres and venue shows.

## Design
Style: Premium, live-event, music-forward.
- `--primary`: 348 100% 54% (Crimson Red - signals "Live")
- `--background`: 0 0% 4% (Near Black - content-first contrast)
- `--foreground`: 0 0% 98% (Clean White)
- `--accent`: 0 0% 12% (Dark Grey for active states)
- `--muted`: 0 0% 60% (Medium Grey for secondary text)
- Fonts: Sora (Headings), IBM Plex Sans (Body), IBM Plex Mono (Data/Time)

## Features
- Persistent sticky audio player that continues playing across page navigation
- Programming schedule grid showing the 5 standard daily blocks and rotating weekly features
- Dynamic video player takeover component for artist-opt-in simulcasts

## AzuraCast rules
Before any task that touches the stream, now playing, schedule data, hosts or AzuraCast, read `otw-radio/docs/AZURACAST_FOR_SOFTGEN.md`. It lists which AzuraCast endpoints the site may call, which must stay server-side, and what the site must never build (next song titles, on-demand playback, song requests, media uploads, DJ passwords).
