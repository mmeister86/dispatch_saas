---
id: TASK-25
title: 'T-031: Clickable canned demo (commit→tweet, client-side)'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:37'
labels:
  - imported-from-docs
  - phase-3
  - t-031
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - tests/launch-readiness.test.mjs
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-031
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 visitor clicks sample commits, sees generated tweet; zero backend/LLM call.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: assert canned commit-to-tweet examples are client-side data, clickable, and do not call Convex/LLM/backend APIs. GREEN: keep the demo as local React state and Rybbit demo event only. Verify focused launch-readiness tests and full suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified the client-side canned commit-to-tweet demo. It uses local React state and only emits the Rybbit demo event; launch-readiness tests assert no Convex generation/drafts API usage in the landing demo.
<!-- SECTION:NOTES:END -->
