---
title: Admin Feature Flags UI
status: todo
priority: high
type: feature
tags: [frontend, admin, ui]
created_by: agent
created_at: 2026-11-06T19:20:44Z
position: 9
---

## Notes
Admin panel UI for toggling feature modules on/off.

Requirements:
- Page or section in admin showing all feature flags
- Toggle switch for each flag (on/off)
- Real-time update when toggled (PATCH /api/admin/feature-flags/:name)
- Show current status and last updated timestamp
- Confirmation before disabling live features
- **Primary use case: mood_tracker_enabled toggle**

Design:
- Simple table or card list showing flag name, status, and toggle
- Visual indicator for enabled/disabled state
- Success toast on update
- Follows existing admin UI patterns

## Checklist
- [ ] Create /admin/features page (or add section to /admin/index)
- [ ] Fetch feature flags from GET /api/admin/feature-flags
- [ ] Display each flag with toggle switch
- [ ] Update flag on toggle (PATCH /api/admin/feature-flags/:name)
- [ ] Show success/error toast on update
- [ ] Add confirmation dialog for disabling active features
- [ ] Display last_updated timestamp for each flag
- [ ] Add link to features page from admin navigation

## Acceptance
- Admins can view all feature flags
- Admins can toggle flags on/off with immediate feedback
- Changes persist and affect frontend component rendering