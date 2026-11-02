---
title: "DJs/Hosts: Host profiles and on-air widget"
status: todo
priority: high
type: feature
tags: [hosts, launch]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 10
---

## Notes
AzuraCast owns host streaming accounts and the live takeover (OBS or RTMP into AzuraCast). The site only shows who is on air, through an embed (`/embed/on-air`) for onestowatch.com and on the staff dashboard. Never put stream passwords, mount credentials or AzuraCast logins in the site or the repo.

## Checklist
- [ ] Add `otw-radio/config/hosts.json`: slug, display name, `azuracast_streamer` (the AzuraCast streamer username), bio, photo, socials, role (`host` or `guest_curator`), and for curators the date of their Noon to 3pm slot
- [ ] Embed `/embed/on-air` (host photo and name while live, otherwise today's guest curator) and staff page `/hosts/[slug]` with bio, photo, socials, and their next slots
- [ ] "On air now" card: when `live.is_live` is true, match `live.streamer_name` to `hosts.json` and show the host's photo and name in the player and on the home page
- [ ] "Today's guest curator" card in the Noon to 3pm block on the home page and schedule
- [ ] Add a `/hosts` index page

## Acceptance
- When a host goes live in AzuraCast, the site shows their profile card within 15 seconds.
- No credentials appear anywhere in the site.
