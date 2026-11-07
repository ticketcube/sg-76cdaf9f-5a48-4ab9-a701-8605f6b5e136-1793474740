---
title: ShowsMapOverlay Component
status: todo
priority: medium
type: feature
tags: [frontend, ui, map, shows]
created_by: agent
created_at: 2026-11-06T19:30:00Z
position: 10
---

## Notes
Venue pins overlay for upcoming shows with clickable ticket links. **Separate layer managed by MapOverlayManager.**

Requirements:
- **Feature flag check:** Fetches shows_map_enabled, renders nothing if disabled
- Display venue pins at lat/lng coordinates from upcoming_shows table
- Different visual style from listener/mood dots (pin/marker icon)
- Click opens popup with show details: artist, venue, date, ticket link
- Fetch shows from GET /api/shows/upcoming
- Pin style matches brand (crimson accent color)
- Works on mobile (touch-friendly pins)
- **Z-index: 3** (top layer, above mood and listener dots)

Pin Design:
- Icon: map pin or venue marker (lucide-react MapPin icon)
- Color: crimson red (#DC2626) to stand out
- Hover: scale + glow effect
- Active: show popup with show info

Popup Contents:
- Artist name (heading)
- Venue name
- Date/time (formatted)
- "Get Tickets" button → opens ticket_url in new tab
- Optional: artist image if image_url provided

## Checklist
- [x] Create src/components/map/ShowsMapOverlay.tsx (venue pins layer)
- [x] Check shows_map_enabled flag, return null if disabled
- [x] Fetch upcoming shows from GET /api/shows/upcoming
- [x] Convert lat/lng to SVG coordinates (match map projection)
- [x] Render venue pins with MapPin icon
- [x] Click handler opens show details popup/card
- [x] Show details include: artist, venue, date, ticket link
- [x] Style ticket links as external buttons with ExternalLink icon
- [x] Pulse animation on pin hover
- [x] Proper z-index (top layer above mood dots)
- [x] Integrate into ListenerMap via MapOverlayManager
- [x] Mobile-responsive popup positioning

## Acceptance
- Shows overlay does not render when feature flag is disabled
- Venue pins display at correct locations on map
- Clicking a pin opens show details popup
- Ticket link opens in new tab when clicked
- Pin styling is distinct from listener/mood dots
- Shows layer sits on top of mood and listener layers
- Mobile users can easily tap pins and view details