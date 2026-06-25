---
id: TASK-36
title: 'T-042: Fix launch-blockers only'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:36'
labels:
  - imported-from-docs
  - phase-4
  - t-042
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - docs/launch/known-blockers.md
  - tests/launch-readiness.test.mjs
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-042
Phase: Phase 4 — Proof, legal & analytics (Sessions 25–28, ~12h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 known-blocker list is empty.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: add/update launch checklist test/documented audit expectation for blocker list. GREEN: create launch blocker checklist and fix only launch blockers: core flow, legal, tracking, footer/OG, severe responsive/UI breakage. Verify `pnpm test`, `pnpm lint`, `pnpm build`; do not mark Done until Matthias confirms manual testing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Known-blockers document now intentionally lists unresolved launch proof items instead of claiming the blocker list is empty: real beta proof, Rybbit live verification, final legal copy, and production social-preview validation.
<!-- SECTION:NOTES:END -->
