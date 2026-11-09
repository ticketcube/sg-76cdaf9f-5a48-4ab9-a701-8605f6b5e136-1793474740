---
title: Admin Feature Flags UI
status: done
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
- [x] Create admin features page at /admin/features
- [x] Use ProtectedRoute with requireAdmin
- [x] Fetch feature flags from GET /api/admin/feature-flags on mount
- [x] Display toggle switches for mood_tracker_enabled and shows_map_enabled
- [x] Implement toggle handler that calls PATCH /api/admin/feature-flags
- [x] Show loading state during fetch
- [x] Show success/error toasts on toggle
- [x] Display descriptive text for each feature flag
- [x] Style with Card components for clean layout

## Acceptance
- Admins can view all feature flags
- Admins can toggle flags on/off with immediate feedback
- Changes persist and affect frontend component rendering