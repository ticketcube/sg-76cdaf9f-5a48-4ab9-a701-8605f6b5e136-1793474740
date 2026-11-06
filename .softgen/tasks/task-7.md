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
Emoji tap interface for mood adjustment during playback. Separate, reusable component.

Requirements:
- 5 emoji buttons (😴 💙 😊 🔥 ⚡) with tap animation
- Submit mood to backend with current song context
- Show visual feedback on successful submission
- Display rate limit message if user taps too soon (client-side preview + backend enforcement)
- Compact design that fits near player controls without cluttering
- Works on mobile (large tap targets)

Design:
- Horizontal emoji row with subtle glow on hover
- Brief scale animation on tap
- Toast notification on successful submission
- Cooldown timer display if rate limited

## Checklist
- [ ] Create src/components/MoodTap.tsx with 5 emoji buttons
- [ ] Add tap animation (scale + opacity transition)
- [ ] Integrate with POST /api/mood/submit endpoint
- [ ] Show success toast on submission
- [ ] Show cooldown message if rate limited (client tracks last submission time)
- [ ] Fetch current now-playing data before submission (song context)
- [ ] Position in AudioPlayer component (above progress bar or in controls)

## Acceptance
- Users can tap an emoji and see immediate visual feedback
- Mood submission includes current song metadata
- Rate limiting is enforced with clear user feedback