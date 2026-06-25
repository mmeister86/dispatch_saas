---
id: TASK-32
title: 'T-040: Collect 3–5 beta testimonials'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:37'
labels:
  - imported-from-docs
  - phase-4
  - t-040
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/landing/testimonials.tsx
  - docs/launch/known-blockers.md
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-040
Phase: Phase 4 — Proof, legal & analytics (Sessions 25–28, ~12h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 real quotes + a Dispatch-written tweet screenshot in the landing block.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: test testimonial data renders 3-5 entries and no placeholder/mock flags remain. GREEN: wire testimonial section/data with available beta-style proof and tweet screenshot assets. If real quotes/screenshots are unavailable, keep acceptance unchecked and document the limitation. Verify landing/testimonial tests plus visual check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Kept this task honest after TASK-29 correction: landing currently has fillable testimonial slots only. Real beta quotes and captured tweet screenshots are still required before this task's acceptance criteria can be completed.
<!-- SECTION:NOTES:END -->
