---
title: MapOverlayManager and Map Layers
status: todo
priority: high
type: feature
tags: [frontend, ui, map, architecture]
created_by: agent
created_at: 2026-11-06T19:13:55Z
position: 8
---

## Notes
**Unified overlay architecture** for managing multiple data layers on top of ListenerMap. Orchestrates mood dots, show pins, and future layers without modifying base map.

**Architecture:**
```
<MapContainer>
  <ListenerMap /> {/* base listener dots - unchanged */}
  <MapOverlayManager>
    <MoodMapOverlay enabled={moodEnabled} />
    <ShowsMapOverlay enabled={showsEnabled} />
    {/* future layers slot in here */}
  </MapOverlayManager>
</MapContainer>
```

**Z-index hierarchy:**
1. Listener dots (base layer, z-index: 1)
2. Mood color overlay (translucent dots, z-index: 2)
3. Show pins (clickable markers, z-index: 3)

**MoodMapOverlay (this task):**
- Feature flag check: renders nothing if mood_tracker_enabled = false
- City mood dots with color spectrum: Blue (0-20) → Purple (21-40) → Orange (41-60) → Red-Orange (61-80) → Red (81-100)
- Pulse animation when mood changes
- Real-time polling (every 10s)
- Positioned at city coordinates from listener data

Color Spectrum:
- 0-20: #1E40AF (Deep Blue)
- 21-40: #7C3AED (Purple)
- 41-60: #F97316 (Orange)
- 61-80: #EF4444 (Red-Orange)
- 81-100: #DC2626 (Bright Red)

## Checklist
- [x] Create src/components/map/MapOverlayManager.tsx (coordinate multiple overlay layers)
- [x] Create src/components/map/MoodMapOverlay.tsx (mood dots layer)
- [ ] Create src/components/map/CityMoodIndicator.tsx (individual mood dot component - integrated into MoodMapOverlay)
- [x] MapOverlayManager accepts children, manages shared map state (dimensions, projection)
- [x] Check mood_tracker_enabled flag in MoodMapOverlay, return null if disabled
- [x] Implement mood-to-color mapping function
- [x] Add pulse animation (scale 1.0 → 1.3 → 1.0 over 600ms with glow)
- [x] Fetch city mood aggregates from GET /api/mood/city-aggregates
- [x] Poll for mood updates every 10 seconds
- [x] Smooth color interpolation with CSS transitions
- [x] Position mood dots at city coordinates (match ListenerMap positioning)
- [x] Ensure proper z-index layering (mood layer above listeners, below shows)
- [x] Integrate MapOverlayManager into pages that render ListenerMap

## Acceptance
- MapOverlayManager successfully coordinates multiple overlay layers
- Mood overlay does not render when feature flag is disabled
- City mood dots display with correct colors based on aggregate mood values
- Dots pulse smoothly when mood data updates
- Z-index hierarchy is correct (listeners → mood → shows)
- Existing ListenerMap functionality is completely unaffected