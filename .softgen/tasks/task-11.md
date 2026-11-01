---
title: "Fans: Artist pages with ticket links"
status: todo
priority: medium
type: feature
tags: [fans, artists, tickets, launch]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 11
---

## Notes
Ticket clicks are the measurable commerce line for onestowatch.live, so every artist surface should carry a tracked ticket link.

## Checklist
- [ ] Add `otw-radio/config/artists.json`: slug, name, Spotify ID (matches the AIMC `Artist Spotify ID` tag), photo, short bio, ticket URL
- [ ] Page `/artists/[slug]` with bio, photo, recent plays on OTW Radio (from `song_history` where available), features they appeared in, and a "Get tickets" button
- [ ] Match the now-playing artist to `artists.json` by name and link the card to the artist page
- [ ] Add UTM parameters (`utm_source=otwradio&utm_medium=player`) to ticket links

## Acceptance
- Clicking the artist on the player opens their page, and the ticket button opens the ticket page in a new tab.
