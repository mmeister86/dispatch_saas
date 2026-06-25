---
id: TASK-30
title: 'T-036: Shareable footer + OG/meta'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:37'
labels:
  - imported-from-docs
  - phase-3
  - t-036
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/layout.tsx
  - components/landing/marketing-footer.tsx
  - public/og-dispatch.svg
  - tests/launch-readiness.test.mjs
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-036
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 footer + correct social preview card.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: add tests for footer links, social/build-log copy, OG/Twitter metadata, and OG asset. GREEN: implement shared landing footer and metadata in `app/layout.tsx` plus referenced asset. REFACTOR: keep footer reusable for legal links. Verify with focused test and `pnpm test`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Footer, OG/Twitter metadata, canonical URL, and OG asset are implemented and covered by launch-readiness tests. Acceptance remains unchecked until the social preview card is validated against the production URL; SVG may need PNG/JPG fallback for X/social validators.
<!-- SECTION:NOTES:END -->
