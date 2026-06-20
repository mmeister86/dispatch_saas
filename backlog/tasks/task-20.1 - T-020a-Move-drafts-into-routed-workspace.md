---
id: TASK-20.1
title: 'T-020a: Move drafts into routed workspace'
status: Done
assignee: []
created_date: '2026-06-19 12:50'
updated_date: '2026-06-20 07:12'
labels:
  - phase-2
  - t-020a
dependencies:
  - TASK-20
parent_task_id: TASK-20
priority: high
ordinal: 20500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move the draft-working experience from the compact home inbox into a dedicated /drafts workspace. The route should show connected repositories and their commit drafts in a left sidebar, with the existing draft editor rendered on the right canvas. Home remains focused on paywall, GitHub connection, X connection, account status, and a CTA to open /drafts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /drafts lists connected repos with commit drafts in a sidebar.
- [x] #2 Selecting a commit opens the existing draft editor on the right canvas.
- [x] #3 Variant selection, editing, image upload, posting, cap messaging, notices, and errors still work.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add source-contract tests for /drafts route, reusable workspace component, connected repo sidebar, canvas editor, and Home CTA.
2. Extract the existing draft editor controls from app/page.tsx into a reusable client component for canvas rendering.
3. Add app/drafts/page.tsx using api.github.connectedRepos and api.drafts.listForReview to render the sidebar plus editor canvas.
4. Replace the Home embedded draft inbox/editor with a CTA link to /drafts while keeping paywall, GitHub, X, and account status.
5. Run pnpm test, pnpm exec tsc --noEmit, and pnpm lint, then request code review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the routed /drafts workspace with repository sidebar, canvas editor, Home CTA, and reviewer fixes for unmatched draft repos plus textarea accessibility. Verification passed: pnpm test, pnpm exec tsc --noEmit, pnpm lint (lint has only existing generated Convex warnings).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved drafts into /drafts with connected repo sidebar, commit selection, and reusable editor canvas. Preserved variant selection, editing, media upload, posting, cap messaging, notices, and errors. Verified with pnpm test, pnpm exec tsc --noEmit, pnpm lint, code review, and Chrome checks.
<!-- SECTION:FINAL_SUMMARY:END -->
