---
id: TASK-21
title: 'T-021: Draft review screen (variants, edit, optional image upload, post)'
status: In Progress
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-22 07:36'
labels:
  - imported-from-docs
  - phase-2
  - t-021
dependencies: []
references:
  - .docs/backlog.md
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-021
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
Note: lovable moment
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 user sees variants, edits text, optionally attaches an image, posts; Evidence Collector confirms the variants are post-worthy.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement TASK-21 on branch codex/task-21-draft-review-screen using TDD.
1. Add tests/drafts-review-screen.test.mjs as a source-contract RED test for the routed review flow: selectable variants, edited text, 280-character post gate, optional image upload, post action, aria-live feedback, and posted confirmation.
2. Run the focused test and confirm it fails because the review polish is missing.
3. Update components/drafts-workspace.tsx only: make selected variant state visible and accessible, add composer/post disabled reason copy, keep text-only default, show image attached state without raw backend detail, and expose upload/post/error feedback through aria-live.
4. Re-run the focused test until it passes, then run pnpm test, pnpm exec tsc --noEmit, pnpm lint, and pnpm build.
5. Evidence Collector pass: inspect 2-3 existing generated fixture variants and add a Backlog note confirming they are post-worthy and avoid changelog-speak.
6. Keep backend interfaces unchanged: no schema changes, no new Convex functions, no separate API layer; broader core-path empty/error state hardening remains TASK-23 scope.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented TASK-21 on branch codex/task-21-draft-review-screen. RED/GREEN: added tests/drafts-review-screen.test.mjs, verified it failed on missing selected-variant/readiness/live-status affordances, then polished components/drafts-workspace.tsx until the focused test passed. Review fixes: removed index-only variant aria-label so visible variant text remains the accessible name; strengthened the contract test to prevent aria-label overrides in the variant button block.

Verification: pnpm test passed 68/68; pnpm exec tsc --noEmit passed; pnpm lint exited 0 with the existing 4 generated Convex unused-disable warnings; pnpm build passed outside the sandbox after sandboxed Turbopack hit Operation not permitted while binding a port.

Evidence Collector confirmed the review screen can present 2-3 generated variants as the lovable moment and that three existing generation fixtures are post-worthy, distinct, and not changelog-speak. Residual risk: current verification is source-contract and build-level, not authenticated browser/screenshot proof of the live /drafts flow.
<!-- SECTION:NOTES:END -->
