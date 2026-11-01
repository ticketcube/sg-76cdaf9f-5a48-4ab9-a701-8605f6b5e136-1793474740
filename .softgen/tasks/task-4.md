---
title: Embeddable Player Widget
status: in_progress
priority: urgent
type: feature
tags: [embed, player, widget]
created_by: agent
created_at: 2026-11-01T08:44:00Z
position: 4
---

## Notes
Standalone embeddable player widget for onestowatch.com that shows now-playing info and controls. Must work via iframe embed and be minimal/clean.

## Checklist
- [x] Create /embed/player route with minimal layout (no nav/footer)
- [x] Display now-playing: track title, artist, album art
- [x] Audio controls: play/pause, volume, mute
- [x] Connect to AzuraCast nowplaying API
- [x] Live updates via polling (30s interval)
- [x] Responsive sizing (300px min width, scales to container)
- [x] Iframe-friendly (no X-Frame-Options on embed routes)

## Acceptance
- Widget loads in iframe on external site
- Shows current track and updates automatically
- Audio plays through and survives page navigation on host site