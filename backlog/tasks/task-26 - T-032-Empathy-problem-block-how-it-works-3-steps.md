---
id: TASK-26
title: 'T-032: Empathy/problem block + how-it-works (3 steps)'
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 20:17'
labels:
  - imported-from-docs
  - phase-3
  - t-032
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/feature276.tsx
  - tests/landing-block-skeleton.test.mjs
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-032
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 both sections live via blocks.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement TASK-26 / T-032 on the existing landing skeleton using TDD. Scope: skip TASK-25 entirely; do not add the clickable canned demo or any backend/LLM/API behavior.

1. RED: update `tests/landing-block-skeleton.test.mjs` so it asserts `components/feature276.tsx` contains the approved T-006 problem copy, the `How it works` heading, and exactly these three step titles: `Connect GitHub`, `Push a commit`, `Pick the draft worth posting`. Also assert generic shadcnblocks copy such as `Build faster with production ready features` is removed and keep guards against Task 25 / later landing copy.
2. Run `pnpm exec node --test tests/landing-block-skeleton.test.mjs` and confirm the new assertions fail against the current generic `Feature276` implementation.
3. GREEN: adapt `components/feature276.tsx` only. Keep the existing shadcnblocks-derived block surface and the existing `<Feature276 />` placement in `app/page.tsx`, but replace generic feature copy with a Dispatch empathy/problem intro plus a three-card how-it-works grid using the approved T-006 copy.
4. Verify focused test with `pnpm exec node --test tests/landing-block-skeleton.test.mjs`.
5. Run final checks: `pnpm test`, `pnpm lint`, and `pnpm build`.
6. Append implementation notes and check acceptance criteria only after verification. Do not set TASK-26 to `Done` until the user confirms after manual review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified the empathy/problem section plus the three-step how-it-works section on the signed-out landing page.

Started TASK-26 execution from the approved plan. TASK-25 is intentionally skipped; implementation is limited to the existing Feature276 landing block and landing skeleton tests.

Implemented the TASK-26 landing update in `components/feature276.tsx`: the existing Feature276 block now contains the approved T-006 empathy/problem copy and a three-step `How it works` section. Updated `tests/landing-block-skeleton.test.mjs` first and confirmed RED before implementation. Verification completed: focused landing test passed, `pnpm test` passed (129 tests), `pnpm lint` exited 0 with pre-existing warnings, and `pnpm build` passed after rerunning outside the sandbox for Google Fonts network access. Code review found no Critical or Important issues; minor metadata issue was fixed by updating modified files. TASK-25 remains skipped.

Acceptance criterion #1 was re-verified after implementation: the empathy/problem section and the three-step how-it-works section now live in the existing landing block. Task remains `In Progress` pending user confirmation for `Done`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented TASK-26 / T-032 by adapting the existing Feature276 landing block into the Dispatch empathy/problem section plus a three-step `How it works` section. The block now uses the approved T-006 copy and keeps TASK-25's clickable demo out of scope.

Updated `tests/landing-block-skeleton.test.mjs` first to require the problem copy, the exact three step titles, removal of generic shadcnblocks copy, and guards against demo/later landing-page scope creep. Verified RED before implementation, then GREEN after updating `components/feature276.tsx`.

Verification before finalization: focused landing test passed, `pnpm test` passed with 129 tests, `pnpm lint` exited 0 with pre-existing warnings, and `pnpm build` passed after rerunning outside the sandbox for Google Fonts network access. Code review found no Critical or Important issues.
<!-- SECTION:FINAL_SUMMARY:END -->
