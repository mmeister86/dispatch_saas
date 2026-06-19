---
id: TASK-41
title: Polish drafts workspace visual design
status: In Progress
assignee: []
created_date: '2026-06-19 13:29'
updated_date: '2026-06-19 16:17'
labels: []
dependencies: []
priority: high
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refine the /drafts workspace UI from rough sketch styling into a polished production interface while preserving the routed sidebar/editor behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /drafts uses a polished responsive sidebar and editor canvas layout
- [x] #2 Draft selection, variant editing, upload, posting, cap messaging, notices, and errors still work
- [x] #3 Chrome visual verification confirms the page looks materially better on localhost
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Polished /drafts into a production-style workspace: rounded app shell, dark sidebar, warm editor canvas, improved row states, clearer status/notice surfaces, accessible selected rows, and Chrome visual verification on localhost:3000/drafts. Verification passed: pnpm test, pnpm exec tsc --noEmit, pnpm lint (lint has only existing generated Convex warnings).

Fixed sidebar clipping after Chrome review by widening the desktop sidebar to a 360-380px minmax track, adding min-width guards, and replacing hard truncation with wrapping commit text. Verified in Chrome on localhost:3000/drafts plus pnpm test, pnpm exec tsc --noEmit, and pnpm lint.
<!-- SECTION:NOTES:END -->
