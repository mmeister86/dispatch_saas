---
id: TASK-23
title: 'T-023: Error/empty states on core path'
status: Done
assignee: []
created_date: '2026-06-17 07:32'
updated_date: '2026-06-22 19:35'
labels:
  - imported-from-docs
  - phase-2
  - t-023
dependencies: []
references:
  - .docs/backlog.md
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-023
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 no repo / no commits / expired X token / over-cap / API failure all handled gracefully.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add failing source-contract tests for no repo, no commits, over-cap, expired X token refresh failure, and X API safe error mapping.
2. Run targeted tests and confirm the new assertions fail for missing behavior.
3. Implement Drafts workspace empty/error states with actionable CTAs and alerts.
4. Implement safe X token refresh and X API failure messages without API contract/schema changes.
5. Run targeted tests, full test suite, lint, and build.
6. Request code review and address any actionable findings before handoff.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementing planned TASK-23 scope: graceful no repo, no commits, expired X token, over-cap, and API failure states on the core Drafts/X posting path.

Verified implementation:
- Added explicit Drafts empty/loading states for no repo, no commits, and selected-draft fallback.
- Added over-cap alert while keeping posting disabled.
- Mapped expired X refresh failures before monthly quota claim.
- Mapped X post and media upload API failures to safe reconnect/retry messages.
- Code review found two P2 issues; both fixed and re-review approved.
- Verification: pnpm test, pnpm lint, pnpm build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped graceful core-path error and empty states: explicit no-repo/no-commits/loading states, over-cap alert, safe expired-X-token handling before quota claim, and safe X post/media API failure messages with regression coverage. Verified with pnpm test, pnpm lint, pnpm build, and code review/re-review.
<!-- SECTION:FINAL_SUMMARY:END -->
