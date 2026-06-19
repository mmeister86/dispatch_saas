---
id: TASK-18
title: 'T-019: Monthly post counter + per-tier cap'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-19 10:24'
labels:
  - imported-from-docs
  - phase-2
  - t-019
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - convex/planLimits.ts
  - convex/billing.ts
  - convex/http.ts
  - convex/x.ts
  - convex/_generated/api.d.ts
  - tests/billing-wiring.test.mjs
  - tests/x-posting.test.mjs
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-019
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 posting increments `postsThisPeriod`; over-cap is blocked with an upgrade prompt.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# TASK-18 / T-019: Monthly Post Counter + Per-Tier Cap

Implement the cap as a Convex backend guard in the existing X posting flow.

1. Add shared plan limit helpers: Good = 20, Better = 60.
2. Extend `billing.currentAccess` active state with `postLimit` and `postsRemaining`.
3. In `claimDraftPosting`, re-check the active subscription transactionally, block when `postsThisPeriod >= postLimit`, increment `postsThisPeriod` as a reservation, and return the reserved `subscriptionId`.
4. If `createXPost` fails, have `clearDraftPosting` release the reservation by decrementing that same subscription safely.
5. Keep `markDraftPosted` responsible only for marking the draft as posted.
6. Reset `postsThisPeriod` to `0` in the Lemon Squeezy webhook when `currentPeriodEnd` changes; preserve it for same-period status/plan updates.
7. Update the subscriber UI to display `postsThisPeriod/postLimit`, remaining posts, and capped copy: Good users see an upgrade prompt; Better users see renewal-date guidance.
8. Keep scope prompt-only for upgrades; do not implement a real Good->Better subscription upgrade checkout in this task.

Tests:
- Add failing x-posting tests for cap check before X post, reservation increment, over-cap blocking, and failed-post cleanup.
- Add/update billing/UI wiring tests for current access limits, webhook rollover reset, and capped UI copy.
- Run `pnpm test`, `pnpm lint`, and `pnpm build`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented monthly post caps for TASK-18: Good=20, Better=60 via shared Convex plan limit helper; `billing.currentAccess` now returns `postLimit` and `postsRemaining`; X posting reserves quota transactionally in `claimDraftPosting`, blocks over-cap Good users with the agreed prompt-only upgrade copy, and releases quota on failed X calls only for the same reserved billing period. Lemon Squeezy subscription upserts now reset `postsThisPeriod` when `currentPeriodEnd` changes and preserve usage within the same period. UI shows used/limit, remaining posts, and capped Good/Better copy while disabling post buttons when capped. Verification: `pnpm test` passed 58/58; `pnpm lint` passed with 0 errors and 4 generated-file warnings; `pnpm build` passed outside sandbox. Independent code review had no critical issues; remaining upgrade-action concern is intentionally out of scope because TASK-18 is prompt-only.

Follow-up from manual UI check: existing posted drafts created before the new counter left `subscriptions.postsThisPeriod` at 0, so the UI could show 0/60 while a draft was already `status=posted`. Root cause is the denormalized subscription counter not being backfilled. Fixed by making `effectivePostsThisPeriodForSubscription` reconcile the stored counter with posted drafts from the inferred current monthly period, and using that effective value in both `billing.currentAccess` and the X posting quota reservation. Verification after fix: `pnpm test` 58/58 passing; `pnpm lint` 0 errors with 4 generated-file warnings; `pnpm build` passing outside sandbox.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented TASK-18 / T-019 monthly post counter and per-tier cap.

Summary:
- Added shared Good/Better post limits and exposed post limit plus remaining usage through `billing.currentAccess`.
- Enforced the monthly post cap in the X posting claim transaction, including quota reservation before the X API call and safe reservation release if the X call fails.
- Reset usage on Lemon Squeezy billing-period rollover while preserving same-period usage.
- Updated the subscriber UI to show used posts, remaining posts, and capped Good/Better copy.
- Fixed the manual-test issue where already-posted drafts from before the counter rollout showed `0/60` by reconciling the stored subscription counter with posted drafts in the current monthly period.

Verification:
- `pnpm test`: 58/58 passing.
- `pnpm lint`: 0 errors, 4 existing generated-file warnings.
- `pnpm build`: passing outside sandbox because Turbopack needs local process/port permissions.
<!-- SECTION:FINAL_SUMMARY:END -->
