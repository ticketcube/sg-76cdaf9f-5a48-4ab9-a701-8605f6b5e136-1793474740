---
title: Global Layout and Sticky Audio Player
status: done
priority: urgent
type: feature
---

## Notes
The station is "audio first", meaning the stream must persist across page navigation. The player provides the core utility of the app and needs to feel premium and tactile.

## Checklist
- [x] Apply design system tokens to CSS and configure fonts (Sora, IBM Plex Sans, IBM Plex Mono)
- [x] Create a persistent global layout wrapper with a minimal top navigation bar (Logo, Schedule, Shows)
- [x] Build a sticky audio player docked to the bottom of the screen
- [x] Add player controls: Play/Pause button, volume slider, "Live" badge, and text placeholder for "Now Playing: OTW Playlist"
- [x] Ensure the player remains visible and interactive on both desktop and mobile viewports
- [x] Connect to live AzuraCast stream and fetch now-playing metadata every 15 seconds

## Acceptance
- The app has a dark premium theme applied across the surface.
- The audio player is fixed at the bottom of the screen and controls are visually responsive to interaction.
- Player persists across page navigation and shows live song information.
