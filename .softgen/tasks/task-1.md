---
title: DJ Streaming Console
status: done
priority: urgent
type: feature
tags: [dj, streaming, azuracast]
created_by: agent
created_at: 2026-11-12T23:36:00Z
position: 1
---

## Notes
Create a custom DJ streaming page that wraps the AzuraCast streaming interface in the OTW brand experience. Phase 1 implementation focuses on core streaming functionality with embedded controls.

## Checklist
- [x] Create `/dj` landing page with navigation to streaming console
- [x] Create `/dj/stream` page with embedded AzuraCast DJ interface
- [x] Add role-based protection (require `otwl-dj` role)
- [x] Display connection info (server, port, mount point)
- [x] Add quick tips section for DJs
- [x] Include fallback link to advanced AzuraCast console
- [x] Apply OTW design system (Crimson primary, near-black background)

## Acceptance
- DJ role users can access `/dj` and see the portal landing page
- Streaming console at `/dj/stream` shows embedded AzuraCast controls
- Connection details are clearly visible for broadcasting software setup
- Advanced console link provides fallback to native AzuraCast page
