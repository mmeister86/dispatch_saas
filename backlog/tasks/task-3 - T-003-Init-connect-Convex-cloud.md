---
id: TASK-3
title: 'T-003: Init + connect Convex (cloud)'
status: Done
assignee: []
created_date: '2026-06-17 07:32'
updated_date: '2026-06-17 07:41'
labels:
  - imported-from-docs
  - phase-1
  - t-003
dependencies: []
references:
  - .docs/backlog.md
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-003
Phase: Phase 1 — Lock & set up (Sessions 1–3, ~9h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `pnpm dlx convex dev` syncs; empty schema deploys.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified on 2026-06-17: read `convex/_generated/ai/guidelines.md`, checked current Convex CLI docs via Context7, then ran `pnpm dlx convex dev --once` outside the sandbox after sandbox DNS failed. The command developed against the Convex dev deployment and completed with `Convex functions ready!`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Verified Convex cloud dev setup. `pnpm dlx convex dev --once` synced against the configured development deployment and completed with `Convex functions ready!`.
<!-- SECTION:FINAL_SUMMARY:END -->
