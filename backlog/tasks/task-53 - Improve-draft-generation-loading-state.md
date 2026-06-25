---
id: TASK-53
title: Improve draft generation loading state
status: In Progress
assignee: []
created_date: '2026-06-25 13:15'
updated_date: '2026-06-25 13:19'
labels:
  - ui
  - drafts
dependencies: []
modified_files:
  - components/drafts-workspace.tsx
  - tests/drafts-review-screen.test.mjs
  - tests/drafts-inbox.test.mjs
priority: medium
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make drafts whose variants are still empty read clearly as in-progress generation instead of showing an empty editor. Keep the change scoped to the drafts inbox/detail UI and tests; do not change backend generation or schema behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Draft detail keeps the commit header visible but shows a prominent generation-pending state when a draft has status draft and no variants.
- [x] #2 The pending-generation state blocks or hides editing, image upload, and posting controls until variants exist.
- [x] #3 Draft queue rows label empty-variant draft rows as Generating instead of only Draft.
- [x] #4 Existing no-repo, no-draft, and initial query loading states continue to render separately.
- [x] #5 Source-contract tests cover the pending state and queue badge behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add source-contract tests for empty-variant draft detail pending generation state and queue badge label.
2. Run the targeted tests and confirm they fail for the missing UI behavior.
3. Update components/drafts-workspace.tsx with a scoped pending-generation branch and queue badge helper.
4. Run targeted tests, then full project verification: pnpm test, pnpm exec tsc --noEmit, pnpm lint.
5. Visually inspect /dashboard/drafts for a selected empty-variant draft and record results.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the pending-generation UI and queue badge. Verification: targeted draft tests passed 6/6; full `pnpm test` passed 120/120 with the existing Node ESM warning; `pnpm exec tsc --noEmit` exited 0; `pnpm lint` exited 0 with 4 existing generated Convex warnings. Screenshot was captured from the live Drafts page, but the currently selected live draft was already Posted, so pending-state visual proof relies on source-contract tests unless a live empty-variant draft is selected/created manually.
<!-- SECTION:NOTES:END -->
