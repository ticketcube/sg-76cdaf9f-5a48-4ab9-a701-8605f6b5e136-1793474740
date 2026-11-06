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
Backend infrastructure for real-time mood tracking with spam prevention and song association. **Feature module with admin-level on/off control.**

**ALSO includes Shows Layer database setup** for upcoming concerts/events with ticket links.

Requirements:
- **Admin toggle:** Create `feature_flags` table with TWO flags: `mood_tracker_enabled` and `shows_map_enabled`
- Track mood changes with user, timestamp, mood value (0-100), and current song
- Rate limit to 1 mood change per 15 seconds per user
- Store mood changes with full song metadata (title, artist, AzuraCast ID)
- City-level mood aggregation (average mood per city, updated in real-time)
- **Shows database:** Track upcoming shows with venue location, date, ticket URL, artist info
- **API checks feature flags:** Mood endpoints check mood_tracker_enabled, shows endpoints check shows_map_enabled
- Expose API endpoints for submitting/retrieving mood data and shows data

Emoji → Mood Value Mapping:
- 😴 Chill: 10
- 💙 Calm: 30
- 😊 Content: 50
- 🔥 Energized: 70
- ⚡ Hyped: 90

## Checklist
- [x] Create `feature_flags` table with columns: id, flag_name (unique), enabled (boolean), updated_at
- [x] Insert rows: ('mood_tracker_enabled', false, now()), ('shows_map_enabled', false, now())
- [x] Add RLS policy: only admins can UPDATE feature_flags
- [x] Create `mood_changes` table with columns: id, user_id, city, mood_value, song_title, song_artist, song_id, created_at
- [x] Add RLS policies: authenticated users can insert their own moods, public can read aggregates
- [x] Create Postgres function for city mood aggregation with time-weighted decay (last 5 minutes)
- [x] Create `upcoming_shows` table with columns: id, artist_name, venue_name, city, lat, lng, show_date, ticket_url, image_url, created_at
- [x] Add RLS policies: admins can manage shows, public can read
- [x] API endpoint: POST /api/mood/submit (checks mood_tracker_enabled flag, returns 503 if disabled)
- [x] API endpoint: GET /api/mood/city-aggregates (checks mood_tracker_enabled flag)
- [x] API endpoint: GET /api/shows/upcoming (checks shows_map_enabled flag, returns shows within date range)
- [x] API endpoint: GET /api/admin/feature-flags (returns all flags)
- [x] API endpoint: PATCH /api/admin/feature-flags/:name (admin-only, updates enabled status)
- [x] Add rate limit check: reject if user submitted mood < 15 seconds ago
- [x] Track song metadata from now-playing API at submission time

## Acceptance
- Admins can toggle mood tracker and shows map on/off independently from admin panel
- All mood APIs check mood_tracker_enabled flag and return 503 when disabled
- All shows APIs check shows_map_enabled flag and return 503 when disabled
- Users can submit mood changes no faster than once per 15 seconds (when enabled)
- City mood aggregates reflect recent mood submissions (time-weighted)
- Upcoming shows can be queried with location data for map display