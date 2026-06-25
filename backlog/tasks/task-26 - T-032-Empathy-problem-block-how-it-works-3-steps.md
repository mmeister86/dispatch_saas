---
id: TASK-26
title: 'T-032: Empathy/problem block + how-it-works (3 steps)'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:37'
labels:
  - imported-from-docs
  - phase-3
  - t-032
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - tests/launch-readiness.test.mjs
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
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: assert empathy/problem and three-step how-it-works sections render with T-006 copy. GREEN: add these sections to the signed-out landing composition. Verify focused launch-readiness tests and full suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified the empathy/problem section plus the three-step how-it-works section on the signed-out landing page.
<!-- SECTION:NOTES:END -->
