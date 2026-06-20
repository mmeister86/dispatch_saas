---
id: TASK-20
title: 'T-020: Drafts inbox screen'
status: Done
assignee: []
created_date: '2026-06-17 07:32'
updated_date: '2026-06-20 07:12'
labels:
  - imported-from-docs
  - phase-2
  - t-020
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - tests/drafts-inbox.test.mjs
  - backlog/tasks/task-20 - T-020-Drafts-inbox-screen.md
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-020
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 lists drafts newest-first; clicking one opens detail.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a focused source-contract test for the drafts inbox modal behavior and verify it fails.
2. Refactor DraftReviewPanel into compact inbox rows plus selectedDraftId state.
3. Extract the existing per-draft controls into DraftDetailModal with dialog semantics, backdrop close, and Escape close.
4. Verify existing posting, editing, upload, cap, notice, and error state wiring remains intact.
5. Run pnpm test, pnpm exec tsc --noEmit, and pnpm lint.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented compact drafts inbox modal on branch codex/task-20-drafts-inbox-modal. RED/GREEN verified tests/drafts-inbox.test.mjs: first failed on missing inbox/modal, then passed after implementation; review fixes added focus management and valid row button markup. Verification: pnpm test passed 64/64; pnpm exec tsc --noEmit exited 0; pnpm lint exited 0 with 4 existing generated-file warnings. Code Reviewer re-review found no remaining Critical or Important findings. Acceptance criterion remains unchecked pending manual UI confirmation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the drafts review experience through the routed /drafts workspace. Drafts remain newest-first from the Convex query and selecting a commit opens the detail editor flow. Superseded the interim modal implementation with the TASK-20.1 routed workspace.
<!-- SECTION:FINAL_SUMMARY:END -->
