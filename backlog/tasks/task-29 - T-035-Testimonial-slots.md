---
id: TASK-29
title: 'T-035: Testimonial slots'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:36'
labels:
  - imported-from-docs
  - phase-3
  - t-035
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/landing/testimonials.tsx
  - tests/launch-readiness.test.mjs
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
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: assert 3-5 testimonial slots exist and are ready to fill, while TASK-32 beta proof can still use current seeded proof. GREEN: ensure testimonial component exposes three slots/proof cards without backend dependencies. Verify focused launch-readiness tests and full suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified 3 testimonial slots that are explicitly ready to fill. Removed fake `realQuote: true` seeded proof so TASK-32 remains honest until real beta quotes/screenshots are supplied.
<!-- SECTION:NOTES:END -->
