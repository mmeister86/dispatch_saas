---
id: TASK-19
title: 'T-019a: Rate-limit generation + post mutation via `@convex-dev/rate-limiter`'
status: To Do
assignee: []
created_date: '2026-06-17 07:32'
labels:
  - imported-from-docs
  - phase-2
  - t-019a
dependencies: []
references:
  - .docs/backlog.md
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-019a
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 rapid repeated triggers (webhook replay, double-click post) are throttled per-user without breaking normal single-commit/single-post usage; sits alongside the monthly cap, doesn't replace it.
<!-- AC:END -->
