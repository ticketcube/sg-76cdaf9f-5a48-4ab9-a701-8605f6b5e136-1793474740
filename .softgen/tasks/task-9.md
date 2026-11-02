---
title: "Fans: Weekly feature widgets"
status: todo
priority: medium
type: feature
tags: [fans, staff, features, launch]
created_by: claude
created_at: 2026-11-01T18:30:00Z
position: 9
---

## Notes
Fans see this on onestowatch.com, so build it as an embed (`/embed/feature/[slug]`) plus a staff preview page, not a public fan page. There is no database at launch, so OTW staff edit feature copy in the repo. Weekly features: Mon Weekly Recap, Tue Chef's Choice, Wed Touring Artists, Thu GWLMMWLG, Fri Artist Interview, Sat Live From the Rooftop (proposed), Sun Best of the Week (proposed). Each premieres at 10am ET and repeats at 3pm ET. Premieres play straight through, no skipping.

## Checklist
- [ ] Read feature titles and weekdays from `otw-radio/config/schedule.json` (`features`)
- [ ] Add `otw-radio/config/features.json` for copy staff will edit: slug, description, host, artwork path, and an episodes list (date, title, blurb, artist)
- [ ] Embed `/embed/feature/[slug]` and staff page `/features/[slug]` with title, description, airtimes in local time with ET beside them, this week's episode, and past episodes
- [ ] Mark Saturday and Sunday "Coming soon" while `proposed` is true
- [ ] Link each feature from the schedule grid and the now-playing card

## Acceptance
- Every weekday feature has a page reachable from `/schedule`.
- Changing `features.json` and pushing updates the page with no code change.
