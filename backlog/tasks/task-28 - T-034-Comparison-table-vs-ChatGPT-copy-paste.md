---
id: TASK-28
title: 'T-034: Comparison table vs "ChatGPT + copy-paste"'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 20:44'
labels:
  - imported-from-docs
  - phase-3
  - t-034
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - tests/launch-readiness.test.mjs
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-034
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 table block live with the rows from PRD §9.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: assert comparison table rows from PRD §9 render against ChatGPT + copy-paste. GREEN: add comparison section to signed-out landing composition. Verify focused launch-readiness tests and full suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified the comparison table against ChatGPT + copy-paste with the expected Dispatch workflow rows.

Implemented the TASK-28 comparison table in components/compare3.tsx and added the focused PRD row assertions to tests/landing-block-skeleton.test.mjs. Focused RED/GREEN check completed with pnpm exec node --test tests/landing-block-skeleton.test.mjs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated the landing comparison block to replace the shadcnblocks Acme/Biz placeholder with the PRD §9 comparison against ChatGPT + copy-paste. Added focused assertions for all required rows, timing values, and placeholder removal in tests/landing-block-skeleton.test.mjs. Verified with pnpm exec node --test tests/landing-block-skeleton.test.mjs (9/9 passing). Full suite/build intentionally not run per the approved minimal TASK-28 plan.
<!-- SECTION:FINAL_SUMMARY:END -->
