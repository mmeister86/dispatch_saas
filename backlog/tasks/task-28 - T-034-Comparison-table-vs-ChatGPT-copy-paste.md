---
id: TASK-28
title: 'T-034: Comparison table vs "ChatGPT + copy-paste"'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:37'
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
<!-- SECTION:NOTES:END -->
