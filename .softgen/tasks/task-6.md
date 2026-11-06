---
title: Mood Tracker Database and API
status: todo
priority: urgent
type: feature
tags: [backend, database, api]
created_by: agent
created_at: 2026-11-06T19:13:55Z
position: 6
---

## Notes
Backend infrastructure for real-time mood tracking with spam prevention and song association.

Requirements:
- Track mood changes with user, timestamp, mood value (0-100), and current song
- Rate limit to 1 mood change per 15 seconds per user
- Store mood changes with full song metadata (title, artist, AzuraCast ID)
- City-level mood aggregation (average mood per city, updated in real-time)
- Expose API endpoints for submitting and retrieving mood data

Emoji → Mood Value Mapping:
- 😴 Chill: 10
- 💙 Calm: 30
- 😊 Content: 50
- 🔥 Energized: 70
- ⚡ Hyped: 90

## Checklist
- [ ] Create `mood_changes` table with columns: id, user_id, city, mood_value, song_title, song_artist, song_id, created_at
- [ ] Add RLS policies: authenticated users can insert their own moods, public can read aggregates
- [ ] Create Postgres function for city mood aggregation with time-weighted decay (last 5 minutes)
- [ ] API endpoint: POST /api/mood/submit (with rate limiting, returns 429 if too soon)
- [ ] API endpoint: GET /api/mood/city-aggregates (returns current mood per city with pulse flag)
- [ ] Add rate limit check: reject if user submitted mood < 15 seconds ago
- [ ] Track song metadata from now-playing API at submission time

## Acceptance
- Users can submit mood changes no faster than once per 15 seconds
- City mood aggregates reflect recent mood submissions (time-weighted)
- Mood submissions include full song context for backend analytics