---
id: TASK-27
title: 'T-033: Pricing block (Good €9 / Better €19, in header)'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:37'
labels:
  - imported-from-docs
  - phase-3
  - t-033
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - tests/launch-readiness.test.mjs
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-033
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 two tiers, prices visible in header, CTA to checkout.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD. RED: assert Good €9 and Better €19 are visible in header/pricing, and CTAs route into checkout intent. GREEN: add header pricing signal and pricing section with the T-006 tier copy. Verify focused launch-readiness tests and full suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified Good €9/mo and Better €19/mo pricing visibility in the header/pricing section. Existing signed-in paywall checkout actions remain wired to Lemon checkout.
<!-- SECTION:NOTES:END -->
