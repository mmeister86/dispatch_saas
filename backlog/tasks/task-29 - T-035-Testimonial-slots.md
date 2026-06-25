---
id: TASK-29
title: 'T-035: Testimonial slots'
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 20:50'
labels:
  - imported-from-docs
  - phase-3
  - t-035
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/testimonial17.tsx
  - tests/landing-block-skeleton.test.mjs
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-035
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 3–5 placeholder slots ready to fill.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement honestly mocked testimonial slots with a focused TDD loop.

1. RED: Add one focused assertion to `tests/landing-block-skeleton.test.mjs` requiring `components/testimonial17.tsx` to expose 3-5 fillable mocked testimonial slots, while rejecting generic shadcnblocks fake customer proof.
2. Run the focused landing test and confirm the new assertion fails against the current placeholder names/quotes.
3. GREEN: Refactor `components/testimonial17.tsx` minimally so it renders exactly three mocked Dispatch beta testimonial slots from a local data array, with honest copy indicating the slots are reserved/ready to fill and no real-user claim.
4. Re-run only the focused landing test. Skip broader test sweeps unless the focused test or TypeScript indicates a risk.
5. Append implementation notes and leave the task open for user confirmation before marking Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified three honest mocked testimonial slots in `components/testimonial17.tsx`. The section no longer uses generic shadcnblocks fake customer names, logos, avatars, or exaggerated proof copy; each slot is visibly reserved for future beta proof and ready to replace once real quotes exist. Added a focused source-contract test in `tests/landing-block-skeleton.test.mjs` to enforce 3-5 slots and guard against fake proof. Verification: `pnpm exec node --test tests/landing-block-skeleton.test.mjs` passed 10/10; `pnpm exec tsc --noEmit` passed. Full suite intentionally skipped per user request.

2026-06-25: Implemented on branch `codex/task-29-testimonial-slots`. Focused landing test and TypeScript check passed; full suite skipped per user preference. Task remains In Progress pending user confirmation before Done.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented honest mocked testimonial slots for the landing page. `components/testimonial17.tsx` now renders three data-driven beta-proof slots with neutral placeholder copy, no fabricated customer names, no external placeholder logos/avatars, and no claim that real testimonials already exist. `tests/landing-block-skeleton.test.mjs` now enforces 3-5 testimonial slots and guards against the removed shadcnblocks fake proof.

Verification run on 2026-06-25: `pnpm exec node --test tests/landing-block-skeleton.test.mjs` passed 10/10, and `pnpm exec tsc --noEmit` passed. Full suite intentionally skipped per user request.
<!-- SECTION:FINAL_SUMMARY:END -->
