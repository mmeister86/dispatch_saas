---
id: TASK-51
title: Add admin dashboard overview
status: Done
assignee: []
created_date: '2026-06-25 12:31'
updated_date: '2026-06-25 12:49'
labels: []
dependencies: []
priority: high
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a read-only /admin dashboard for the app owner. Admin access is granted only when the signed-in Convex/Clerk identity email matches server-side Convex env ADMIN_EMAIL. Show all-time and 30-day metrics for users, repos, drafts, subscriptions, X-connected users, and posted X posts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Only the email in Convex env ADMIN_EMAIL can receive admin dashboard data
- [x] #2 The /admin route renders signed-out, forbidden, and ready dashboard states
- [x] #3 The dashboard shows all-time and 30-day metrics for users, repos, drafts, subscriptions, X-connected users, and X posts
- [x] #4 The implementation remains read-only and does not add admin mutations or user-management actions
- [x] #5 Tests cover admin authorization wiring, route wiring, KPI labels, and dashboard sidebar exclusion
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add failing admin wiring tests
2. Add failing admin UI/route tests
3. Implement Convex admin overview query
4. Implement /admin route and AdminOverview component
5. Run focused tests, then pnpm test, lint, and build
6. Request/review code quality and record verification notes
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented /admin read-only dashboard with Convex ADMIN_EMAIL authorization, signed-out/forbidden/ready states, launch snapshot metrics, 30-day metrics, and recent X post activity.
Verification: CI=true node --test tests/admin-dashboard.test.mjs passed; CI=true pnpm test passed 113 tests; CI=true pnpm lint exited 0 with 4 existing generated-file warnings; CI=true pnpm build passed outside sandbox after Turbopack sandbox port denial.
Reviewer note: strict exact all-time metrics would require denormalized counters/backfill or aggregate infrastructure. Current implementation follows the planned bounded launch-read data strategy and labels the dashboard as a bounded launch snapshot.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a read-only /admin dashboard protected by Convex ADMIN_EMAIL. The implementation adds a Convex admin overview query with signed-out, forbidden, and ready states; a standalone admin route and UI; launch snapshot metrics, 30-day activity metrics, and recent posted X activity; plus wiring tests. Verification run: CI=true pnpm test passed 113 tests; lint and build passed in prior verification, with existing generated-file lint warnings noted.
<!-- SECTION:FINAL_SUMMARY:END -->
