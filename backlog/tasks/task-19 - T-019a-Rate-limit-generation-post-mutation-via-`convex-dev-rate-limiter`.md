---
id: TASK-19
title: 'T-019a: Rate-limit generation + post mutation via `@convex-dev/rate-limiter`'
status: Done
assignee:
  - codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-19 11:57'
labels:
  - imported-from-docs
  - phase-2
  - t-019a
dependencies: []
references:
  - .docs/backlog.md
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-019a
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 rapid repeated triggers (webhook replay, double-click post) are throttled per-user without breaking normal single-commit/single-post usage; sits alongside the monthly cap, doesn't replace it.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# Task 19: Rate-Limit Generation and X Posting

## Summary
Add the official Convex rate limiter component, define two per-user limits, and apply them at the existing choke points: before scheduling commit-to-variant generation, and before claiming/posting a draft to X. Keep the monthly post cap in claimDraftPosting unchanged.

## Key Changes
- Add @convex-dev/rate-limiter via pnpm.
- Register the component in convex/convex.config.ts alongside Resend.
- Add convex/rateLimits.ts exporting a shared rateLimiter with Balanced defaults: generateDraftVariants token bucket (rate 3, period 60000, capacity 3) and postDraftToX fixed window (rate 1, period 10000).
- In convex/http.ts, keep duplicate-draft checks before consuming generation capacity; if generation is limited for repo.userId, skip scheduling generation and still acknowledge GitHub.
- In convex/x.ts, after auth/text/ownership/idempotency validation and before token refresh, claimDraftPosting, and createXPost, consume postDraftToX keyed by postingContext.userId; if limited, throw the user-facing retry message.
- Run Convex codegen so generated component typings include components.rateLimiter.

## Test Plan
- Add tests/rate-limiter-wiring.test.mjs first.
- Verify package dependency and Convex component registration.
- Verify generated api exposes components.rateLimiter.
- Verify generation limit ordering, per-user key, and skip behavior.
- Verify post limit ordering, idempotent already-posted behavior before limiting, and monthly cap remains intact.
- Run pnpm test, pnpm exec tsc --noEmit, and pnpm lint.

## Assumptions
Balanced throttling is selected. Generation throttling is silent for webhook replay to avoid retry storms. Posting throttling is user-facing. No app schema changes are needed; the component owns its own tables. Do not mark Done until user confirmation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented rate limiting for Task 19.

Verification:
- RED: pnpm test tests/rate-limiter-wiring.test.mjs failed before implementation because @convex-dev/rate-limiter, convex/rateLimits.ts, and imports/wiring were missing.
- GREEN: pnpm test tests/rate-limiter-wiring.test.mjs passed 4/4.
- Regression: pnpm test passed 62/62.
- Typecheck: pnpm exec tsc --noEmit exited 0.
- Lint: pnpm lint exited 0 with 4 generated-file warnings about unused eslint-disable directives.
- Code review subagent found no issues; residual risk is that tests are static wiring/order tests rather than Convex runtime integration tests.

Task remains In Progress pending user confirmation before Done.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary
- Added the official @convex-dev/rate-limiter component and registered it in Convex.
- Added shared balanced per-user limits for webhook-triggered draft generation and X posting.
- Protected GitHub push generation after duplicate checks with silent skip behavior, and protected X posting before token refresh, quota reservation, and X API calls while preserving the monthly post cap.

## Verification
- RED: pnpm test tests/rate-limiter-wiring.test.mjs failed before implementation because the package, shared rateLimits module, and wiring were missing.
- GREEN: pnpm test tests/rate-limiter-wiring.test.mjs passed 4/4.
- Regression: pnpm test passed 62/62.
- Typecheck: pnpm exec tsc --noEmit exited 0.
- Lint: pnpm lint exited 0 with 4 existing/generated-file warnings about unused eslint-disable directives.
- Code review subagent found no issues.

## Notes
- Generation throttling is intentionally silent for webhook replay to avoid retry storms.
- Posting throttling returns the user-facing retry message from the action.
- Tests are static wiring/order tests rather than live Convex component integration tests.
<!-- SECTION:FINAL_SUMMARY:END -->
