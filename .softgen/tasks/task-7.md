---
title: MoodTap Component
status: todo
priority: high
type: feature
tags: [frontend, ui, player]
created_by: agent
created_at: 2026-11-06T19:13:55Z
position: 7
---

## Notes
Emoji tap interface for mood adjustment during playback. **Modular component with feature flag check — renders only when enabled.**

Requirements:
- **Feature flag check:** Component fetches mood_tracker_enabled on mount, renders null if disabled
- 5 emoji buttons (😴 💙 😊 🔥 ⚡) with tap animation
- Submit mood to backend with current song context
- Show visual feedback on successful submission
- Display rate limit message if user taps too soon (client-side preview + backend enforcement)
- Compact design that fits near player controls without cluttering
- Works on mobile (large tap targets)
- **Completely separate from player core logic** — can be removed without breaking playback

Design:
- Horizontal emoji row with subtle glow on hover
- Brief scale animation on tap
- Toast notification on successful submission
- Cooldown timer display if rate limited
- **Hidden entirely when feature flag is off** (no placeholder, no UI space)

## Checklist
- [x] Create src/components/MoodTap.tsx with 5 emoji buttons
- [x] Check feature flag on component mount (GET /api/admin/feature-flags)
- [x] Return null if mood_tracker_enabled = false (no render)
- [x] Add tap animation (scale + opacity transition)
- [x] Integrate with POST /api/mood/submit endpoint
- [x] Show success toast on submission
- [x] Show cooldown message if rate limited (client tracks last submission time)
- [x] Fetch current now-playing data before submission (song context)
- [x] Add MoodTap to AudioPlayer as conditional overlay (renders below controls)

## Acceptance
- Component does not render when feature flag is disabled
- Users can tap an emoji and see immediate visual feedback (when enabled)
- Mood submission includes current song metadata
- Rate limiting is enforced with clear user feedback