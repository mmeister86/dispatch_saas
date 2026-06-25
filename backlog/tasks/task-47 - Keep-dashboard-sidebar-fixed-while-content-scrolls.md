---
id: TASK-47
title: Keep dashboard sidebar fixed while content scrolls
status: Done
assignee:
  - Codex
created_date: '2026-06-25 08:58'
updated_date: '2026-06-25 09:07'
labels:
  - ui
  - dashboard
dependencies: []
modified_files:
  - components/ui/sidebar.tsx
  - components/dashboard/app-sidebar.tsx
  - tests/dashboard-shell.test.mjs
priority: medium
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the dashboard navigation stay visible while the main workspace content scrolls, so users do not lose navigation context on long dashboard pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dashboard sidebar remains visible when scrolling long dashboard pages on desktop-sized viewports.
- [x] #2 Main dashboard content can still scroll normally without being covered by the sidebar.
- [x] #3 Existing dashboard navigation styling and active states are preserved.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing dashboard shell/sidebar components and current dashboard layout test coverage.
2. Add or update a focused test that asserts the desktop sidebar uses sticky positioning while the main content remains scrollable.
3. Apply the minimal layout/class change in the existing dashboard shell/sidebar implementation.
4. Run the relevant tests and type/lint checks available for the changed surface.
5. Check acceptance criteria that are verified and leave the task In Progress until user confirms manual testing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented sticky desktop sidebar by moving the behavior into the shared Sidebar primitive (`md:sticky md:top-0 md:h-screen`) and removing the dashboard-specific `md:h-auto` override.

Verified with RED/GREEN focused test, full test suite, lint, TypeScript check, and browser computed-style check on `http://localhost:3000/dashboard/drafts` showing `position: sticky`, `top: 0px`, and viewport-height sidebar.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Made the dashboard sidebar sticky on desktop by moving sticky positioning into the shared Sidebar primitive and removing the dashboard-specific height override that allowed it to scroll with page content.

Changed files:
- `components/ui/sidebar.tsx`: sidebar now uses `md:sticky md:top-0 md:h-screen`.
- `components/dashboard/app-sidebar.tsx`: removed `md:h-auto` override.
- `tests/dashboard-shell.test.mjs`: added regression assertions for sticky desktop sidebar classes.

Verification:
- `pnpm test -- tests/dashboard-shell.test.mjs`
- `pnpm test` (96/96 passing)
- `pnpm lint` (0 errors; existing generated Convex warnings only)
- `pnpm exec tsc --noEmit`
- Browser computed-style check on `/dashboard/drafts` confirmed `position: sticky`, `top: 0px`, and viewport-height sidebar.
<!-- SECTION:FINAL_SUMMARY:END -->
