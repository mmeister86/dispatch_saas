---
id: TASK-29.1
title: 'T-035a: Adapt landing FAQ from product docs'
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-25 20:53'
updated_date: '2026-06-25 20:56'
labels:
  - phase-3
  - landing
  - faq
  - t-035a
dependencies: []
references:
  - .docs/T-006-positioning-landing-copy.md
  - .docs/PRD.md
  - task-29
modified_files:
  - components/faq15.tsx
  - tests/landing-block-skeleton.test.mjs
parent_task_id: TASK-29
priority: medium
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up to TASK-29 for landing-page polish. Replace the generic shadcnblocks shelter/pet FAQ copy with Dispatch-specific FAQ copy grounded in `.docs/T-006-positioning-landing-copy.md` and the PRD. Work directly on `main` per user request. Scope is limited to the existing FAQ block and source-contract coverage; do not redesign the landing page or add new FAQ behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The landing FAQ uses the T-006 headline `Questions before your first draft?` and answers the documented Dispatch questions about automatic posting, ChatGPT wrapper positioning, content calendars, and no free plan.
- [x] #2 The FAQ block no longer contains generic shelter/pet placeholder copy or animal-adoption icons/copy.
- [x] #3 Focused landing tests cover the FAQ copy and placeholder removal.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement directly on `main` with a focused TDD loop.

1. RED: Extend `tests/landing-block-skeleton.test.mjs` with one FAQ source-contract test that reads `components/faq15.tsx`, requires the T-006 FAQ headline/questions/answers, and rejects shelter/pet placeholder copy plus old pet-related icons.
2. Run `pnpm exec node --test tests/landing-block-skeleton.test.mjs` and confirm the new FAQ assertions fail against the current generic shadcnblocks FAQ.
3. GREEN: Update only `components/faq15.tsx` to use Dispatch-specific FAQ items from `.docs/T-006-positioning-landing-copy.md`, choosing icons that fit the questions without changing the component API or landing-page composition.
4. Re-run the focused landing test and `pnpm exec tsc --noEmit` because the TSX imports change.
5. Check acceptance criteria, write implementation notes/final summary, leave no branch work because this is intentionally direct on `main`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the landing FAQ copy from `.docs/T-006-positioning-landing-copy.md` directly on `main` per user request. `components/faq15.tsx` now uses the documented Dispatch FAQ headline and four questions/answers about automatic posting, ChatGPT wrapper positioning, content calendars, and no free plan. Removed the shadcnblocks shelter/pet placeholder copy and pet-related icons. Added focused source-contract coverage in `tests/landing-block-skeleton.test.mjs` for the expected FAQ copy and placeholder removal.

Verification: `pnpm exec node --test tests/landing-block-skeleton.test.mjs` passed 11/11; `pnpm exec tsc --noEmit` passed. Full suite intentionally not run for this small landing-copy update.

2026-06-25: Acceptance criteria verified with focused landing test and TypeScript check. Leaving task In Progress pending user confirmation before Done.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adapted the landing FAQ to use the documented Dispatch FAQ copy from `.docs/T-006-positioning-landing-copy.md`. The existing FAQ block now answers automatic posting, ChatGPT-wrapper positioning, content-calendar need, and free-plan availability, and no longer contains the shadcnblocks shelter/pet placeholder copy.

Verification completed before user acceptance: `pnpm exec node --test tests/landing-block-skeleton.test.mjs` passed 11/11 and `pnpm exec tsc --noEmit` passed. User confirmed task completion on 2026-06-25.
<!-- SECTION:FINAL_SUMMARY:END -->
