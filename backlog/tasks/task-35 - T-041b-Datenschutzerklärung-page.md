---
id: TASK-35
title: 'T-041b: Datenschutzerklärung page'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:36'
labels:
  - imported-from-docs
  - phase-4
  - t-041b
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/datenschutz/page.tsx
  - components/landing/marketing-footer.tsx
  - tests/launch-readiness.test.mjs
  - docs/launch/known-blockers.md
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-041b
Phase: Phase 4 — Proof, legal & analytics (Sessions 25–28, ~12h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 static `/datenschutz` route live covering Rybbit, Clerk, Lemon Squeezy, Resend, and X/GitHub data flows; linked in the footer.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: test `/datenschutz` route exists, footer links to it, and page mentions Rybbit, Clerk, Lemon Squeezy, Resend, GitHub, X, Convex/Vercel. GREEN: implement static route using final supplied privacy text where available. Verify route test and manual footer navigation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Static `/datenschutz` route and footer link are implemented and name the current processors/services. Acceptance remains pending until final privacy text is supplied/reviewed.
<!-- SECTION:NOTES:END -->
