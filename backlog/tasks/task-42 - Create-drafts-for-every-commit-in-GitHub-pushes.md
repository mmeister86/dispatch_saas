---
id: TASK-42
title: Create drafts for every commit in GitHub pushes
status: In Progress
assignee:
  - Codex
created_date: '2026-06-22 19:50'
updated_date: '2026-06-22 19:58'
labels:
  - github
  - drafts
  - webhook
dependencies: []
references:
  - convex/http.ts
  - tests/github-wiring.test.mjs
  - tests/rate-limiter-wiring.test.mjs
modified_files:
  - convex/http.ts
  - tests/github-wiring.test.mjs
  - tests/rate-limiter-wiring.test.mjs
priority: high
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the GitHub push webhook flow so a push containing multiple commits creates one review draft per valid commit instead of only the head commit. This fixes the drafts workspace showing only the last pushed commit after a multi-commit push.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A GitHub push payload with multiple valid commits creates a separate draft for every valid commit.
- [x] #2 GitHub delivery replays remain idempotent: existing drafts for the same repo and commit SHA are skipped without duplicates.
- [x] #3 Draft insertion is not blocked by generation rate limiting; new drafts can appear with empty variants while generation is scheduled later.
- [x] #4 Variant generation remains rate limited per user and is scheduled with any retry delay returned by the rate limiter.
- [x] #5 Delete and empty pushes continue to be acknowledged without creating drafts.
- [x] #6 The implementation has tests covering multi-commit payloads, fallback behavior, deduplication, idempotency, and generation rate-limit scheduling.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add failing source-contract tests for multi-commit push handling and generation scheduling.
2. Run the targeted tests to verify the new expectations fail against the current head-commit-only implementation.
3. Update `convex/http.ts` to collect all valid pushed commits, dedupe by SHA, and pass them to a plural draft creation mutation.
4. Insert drafts before rate-limit reservation, skip existing drafts idempotently, and schedule generation with `retryAfter ?? 0`.
5. Run targeted tests, then full `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint`.
6. Review the diff against TASK-42 acceptance criteria and leave the task In Progress pending user confirmation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented multi-commit GitHub push draft creation on branch `codex/task-42-multi-commit-drafts`. The webhook now collects valid commits from `payload.commits[]`, dedupes commit SHAs, sends a plural commit list to the internal draft mutation, inserts each new draft before generation rate-limit reservation, and schedules variant generation with `generationLimit.retryAfter ?? 0`. Payload validation now accepts `commits` as an array without rejecting individual invalid entries up front, so mixed valid/invalid commit arrays can still produce drafts for the valid commits. Empty pushes remain ignored by design per AC #5.

Verification:
- `pnpm exec node --test tests/github-wiring.test.mjs tests/rate-limiter-wiring.test.mjs` passed: 12/12.
- `pnpm test` passed: 84/84.
- `pnpm exec tsc --noEmit` passed.
- `pnpm lint` passed with 0 errors and 4 existing warnings in generated Convex files.
- `git diff --check` passed.

Review:
- Initial review found the payload validator rejected mixed valid/invalid commits before filtering; fixed by widening commit payload validation and filtering in `selectDraftCommits`.
- Re-review noted `commits: []` still bypasses fallback; kept intentionally because empty pushes should not create drafts per TASK-42 AC #5.
<!-- SECTION:NOTES:END -->
