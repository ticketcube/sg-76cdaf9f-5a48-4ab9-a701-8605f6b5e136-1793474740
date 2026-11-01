---
title: "Later (Supabase): OTW staff admin"
status: todo
priority: low
type: feature
tags: [staff, admin, supabase, later]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 12
---

## Notes
Not for launch. Needs a dedicated Supabase project first. Until then staff edit `schedule.json`, `features.json`, `hosts.json` and `artists.json` in the repo. AzuraCast stays the place for uploading and tagging tracks, building playlists and rotation, scheduling the 10am and 3pm features, creating streamer accounts, and pulling play logs for SoundExchange.

## Checklist
- [ ] Staff sign-in with Supabase Auth (email allowlist)
- [ ] Move features, episodes, hosts, guest curators and artists into Supabase tables, keeping the JSON files as a fallback
- [ ] Admin pages to edit the schedule, feature pages, episode blurbs, curator bios and artwork uploads
- [ ] Changes to the grid write back so the sync service can rebuild AzuraCast playlists
- [ ] All AzuraCast and Supabase service keys stay server-side

## Acceptance
- A staff member can publish a new episode blurb without touching the repo.
