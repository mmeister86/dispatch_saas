---
id: TASK-31
title: 'T-037: Polish core flow until the lovable moment lands'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:37'
labels:
  - imported-from-docs
  - phase-3
  - t-037
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/drafts-workspace.tsx
  - tests/launch-readiness.test.mjs
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-037
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 review screen feels fast/delightful; signed off by Reality Checker.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: extend draft-review tests for clearer variant comparison, selected state, generating state, and posting-success copy. GREEN: polish only `components/drafts-workspace.tsx`; no backend scope. Verify mock user feedback acceptance: selected variant is obvious, success says it shipped, and commit-to-tweet feels immediate. Verify with focused tests and `pnpm test`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Draft-review lovable-moment polish is implemented and covered by source-level tests: clearer selected angle state, generating copy, and shipped outcome copy. Manual authenticated visual proof is still needed before user-facing signoff.
<!-- SECTION:NOTES:END -->
