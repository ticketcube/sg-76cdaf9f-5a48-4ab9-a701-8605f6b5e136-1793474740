---
title: Embeddable Schedule Widget
status: in_progress
priority: urgent
type: feature
tags: [embed, schedule, widget]
created_by: agent
created_at: 2026-11-01T08:44:00Z
position: 5
---

## Notes
Schedule display widget matching OTWSchedule.png design. Shows daily time blocks + weekly features. Must pull live data from AzuraCast schedule API and config/schedule.json.

## Checklist
- [x] Create /embed/schedule route with minimal layout
- [x] Daily Schedule section: 5 time blocks with show names
- [x] Weekly Features section: Monday-Friday with feature names
- [x] Match visual design: dark background, white text, clean typography
- [x] Load schedule data from AzuraCast API + local config
- [x] Responsive layout (stacks on mobile)
- [x] Iframe-friendly for onestowatch.com embedding

## Acceptance
- Schedule displays correct daily blocks and weekly features
- Visual design matches OTWSchedule.png reference
- Widget embeds cleanly in iframe on external site