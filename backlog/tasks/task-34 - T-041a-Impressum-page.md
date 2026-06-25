---
id: TASK-34
title: 'T-041a: Impressum page'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:36'
labels:
  - imported-from-docs
  - phase-4
  - t-041a
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/impressum/page.tsx
  - components/landing/marketing-footer.tsx
  - tests/launch-readiness.test.mjs
  - docs/launch/known-blockers.md
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-041a
Phase: Phase 4 — Proof, legal & analytics (Sessions 25–28, ~12h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 static `/impressum` route live with Matthias' legally required sole-proprietor details, linked in the footer.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: test `/impressum` route exists and footer links to it. GREEN: implement static route using final supplied legal details where available; do not ship generated legal placeholders. Verify route test and manual footer navigation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Static `/impressum` route and footer link are implemented for navigation/testing. Acceptance remains pending until Matthias supplies final legal details for the page.
<!-- SECTION:NOTES:END -->
