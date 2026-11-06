---
title: CityMoodIndicator Component
status: todo
priority: high
type: feature
tags: [frontend, ui, map]
created_by: agent
created_at: 2026-11-06T19:13:55Z
position: 8
---

## Notes
City dot pulse and color component. Handles mood visualization on the listener map. Separate from ListenerMap logic.

Requirements:
- Receive city mood aggregate data (mood value 0-100)
- Map mood value to color spectrum: Blue (0-20) → Purple (21-40) → Orange (41-60) → Red-Orange (61-80) → Red (81-100)
- Pulse effect when mood changes (brief scale + glow animation)
- Real-time updates via polling or WebSocket (start with polling every 10s)
- Smooth color transitions between mood states

Color Spectrum:
- 0-20: #1E40AF (Deep Blue)
- 21-40: #7C3AED (Purple)
- 41-60: #F97316 (Orange)
- 61-80: #EF4444 (Red-Orange)
- 81-100: #DC2626 (Bright Red)

## Checklist
- [ ] Create src/components/CityMoodIndicator.tsx
- [ ] Implement mood-to-color mapping function
- [ ] Add pulse animation trigger (scale 1.0 → 1.3 → 1.0 over 600ms)
- [ ] Fetch city mood aggregates from GET /api/mood/city-aggregates
- [ ] Poll for updates every 10 seconds
- [ ] Smooth color interpolation with CSS transitions
- [ ] Replace static dots in ListenerMap with CityMoodIndicator instances

## Acceptance
- City dots display colors based on aggregate mood
- Dots pulse when mood data updates
- Color transitions are smooth and visually appealing