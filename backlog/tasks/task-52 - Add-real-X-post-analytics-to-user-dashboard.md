---
id: TASK-52
title: Add real X post analytics to user dashboard
status: Done
assignee: []
created_date: '2026-06-25 12:55'
updated_date: '2026-06-25 13:12'
labels:
  - dashboard
  - analytics
  - convex
  - x-api
dependencies: []
modified_files:
  - convex/schema.ts
  - convex/analytics.ts
  - convex/x.ts
  - convex/xApi.ts
  - convex/crons.ts
  - components/dashboard/dashboard-overview.tsx
  - components/dashboard/analytics-workspace.tsx
  - tests/analytics-contract.test.mjs
  - tests/dashboard-shell.test.mjs
  - tests/x-posting.test.mjs
priority: high
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace mock user dashboard analytics with Convex-backed metrics for Dispatch-published X posts. Store X metric refresh tracking and snapshots, poll official X API using existing posted draft IDs, and show real metrics in dashboard overview and analytics pages while keeping Rybbit scoped to product funnel tracking.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Convex schema includes xPostMetricRefreshes and xPostMetricSnapshots tables with indexes for user, draft/post lookup, and due refresh polling.
- [x] #2 Posting a draft enqueues analytics tracking for the stored xPostId without exposing X tokens to the client.
- [x] #3 A scheduled internal Convex refresh fetches X public metrics, attempts private/organic metrics, falls back to public-only metrics when unavailable, and stores bounded snapshots safely.
- [x] #4 /dashboard and /dashboard/analytics read api.analytics data instead of mockAnalytics and show pending/no-post/private-metrics-unavailable states.
- [x] #5 Tests cover schema contracts, X helper behavior, analytics auth/query/internal function contracts, dashboard wiring, and the focused suite/typecheck pass.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Fetch current Convex/X docs and confirm existing dashboard/posting shape.
2. Write failing source-contract tests for schema, analytics backend, X metrics helper, cron wiring, and dashboard usage.
3. Implement Convex schema and analytics module with internal tracking/refresh helpers and public summary query.
4. Add X metrics fetch helper with private-metric fallback and safe errors.
5. Wire posting success to enqueue analytics tracking and add scheduled refresh cron.
6. Replace mock dashboard analytics UI with Convex-backed data and states.
7. Run focused tests, full tests, typecheck, lint, build, and browser QA; update Backlog acceptance criteria.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented real X post analytics for the user dashboard. Added Convex refresh/snapshot tables, analytics query/internal refresh workflow, X post metrics lookup with full/private fields and public-only fallback, 15-minute cron, posting enqueue wiring, and dashboard UI replacement for mock analytics. Verification: focused analytics/dashboard/x-posting tests pass 19/19; full pnpm test passes 118/118; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 existing generated Convex warnings; pnpm exec convex dev --once --typecheck enable passes and deployed functions to dev; pnpm build passes outside sandbox after sandbox EPERM on Turbopack port binding; HTTP smoke checks for /dashboard and /dashboard/analytics return 200 on local dev server. Playwright visual QA could not run because the Playwright Chromium binary is not installed locally. Dev logs after fresh server start show no new errors, only the existing Clerk development-key warning. TASK-52 remains In Progress pending user manual confirmation before Done.

Follow-up UI correction from manual review: per-post analytics cells now render missing X metric values as 0 instead of "Pending", since the post is already online and the API simply has not returned metric values yet. Added a source-contract assertion preventing "Pending" from returning in the analytics workspace. Verification: pnpm exec node --test tests/analytics-contract.test.mjs passes 5/5; pnpm exec tsc --noEmit passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped real X post analytics for the user dashboard. Dispatch now stores analytics refresh state and metric snapshots in Convex, enqueues tracking after successful X posts, polls X every 15 minutes with full/private metric lookup plus public-only fallback, and renders Convex-backed analytics in /dashboard and /dashboard/analytics. The follow-up UI correction renders missing per-post metrics as 0 instead of Pending. Verification before closing: pnpm test passed 118/118; pnpm exec tsc --noEmit passed; pnpm lint passed with 0 errors and 4 existing generated Convex warnings; pnpm build passed outside sandbox.
<!-- SECTION:FINAL_SUMMARY:END -->
