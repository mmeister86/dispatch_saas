---
id: TASK-14
title: 'T-016: Wire generation to webhook → drafts populated'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 20:09'
labels:
  - imported-from-docs
  - phase-2
  - t-016
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - convex/http.ts
  - convex/generation.ts
  - tests/github-wiring.test.mjs
  - tests/generation-engine.test.mjs
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-016
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 a push produces a draft with variants within a few seconds.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# TASK-14 / T-016: Wire Generation to GitHub Push Drafts

## Summary
Connect the existing GitHub push webhook draft stub to the existing internal generation engine so a valid `push` creates a `draft` whose `variants` are populated shortly after insertion. Keep the webhook fast: it should acknowledge GitHub after scheduling generation, not wait on OpenAI.

## Task Breakdown & Team Assembly
- Backend Architect: wire Convex `http` mutation -> scheduler -> internal generation action -> draft patch mutation.
- Twitter/X Engager: verify generated variants remain 2-3 distinct BIP-style posts, not changelog copy.
- Code Reviewer / Reality Checker: confirm idempotency, no public generation endpoint, and no schema overbuild.

## Implementation Changes
- In `convex/http.ts`, change `createDraftFromGithubPushWebhook` so newly inserted drafts schedule `internal.generation.populateDraftVariants` with `ctx.scheduler.runAfter(0, ...)`.
- In `convex/generation.ts`, add an internal action that accepts `draftId`, `commitMessage`, calls the existing generation logic, then runs an internal mutation to patch `drafts.variants`.
- Add an internal mutation that updates only the target draft variants; leave `status: "draft"` unchanged.
- Preserve existing replay behavior: if a draft already exists for `repoId + commitSha`, skip insertion and do not regenerate.
- No schema change and no new public API.

## Tests & Acceptance
- Extend `tests/github-wiring.test.mjs` to assert the webhook draft mutation schedules generation only after insert and still skips existing drafts.
- Extend `tests/generation-engine.test.mjs` to assert the new population action is internal, takes `draftId`, calls `generateCommitVariants`, and writes variants through an internal mutation.
- Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint`.
- Manual acceptance after env setup: send a signed GitHub `push` webhook to `/github/webhook`, then confirm the created draft has 2-3 populated variants within a few seconds.

## Assumptions
- Empty `variants: []` is acceptable briefly while scheduled generation runs.
- Generation failures should surface in Convex logs for this task; richer user-facing retry/error state belongs to later core-path error-state work.
- `TASK-13` generation code is treated as available, although its Backlog status still needs separate cleanup.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented TASK-14 wiring with TDD. RED: added tests for push draft scheduling and internal draft variant population, observed expected failures for missing scheduler/action wiring. GREEN: `createDraftFromGithubPushWebhook` now captures the inserted draft id and schedules `internal.generation.populateDraftVariants` with `ctx.scheduler.runAfter(0, ...)`; existing draft replay continues before insertion/scheduling. `convex/generation.ts` now shares generation logic, exposes internal `populateDraftVariants`, and patches only `drafts.variants` via internal `updateDraftVariants`.

Verification: `pnpm test` passed 38/38; `pnpm exec tsc --noEmit` exited 0; `pnpm lint` exited 0 with 4 existing warnings in Convex generated files only. Twitter Engager review found no issues; Code Reviewer / Reality Checker found no blocker correctness issues and noted only that tests remain source-contract tests, consistent with the existing suite. Acceptance criterion remains unchecked pending manual signed GitHub push + real generation verification.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TASK-14 wired GitHub push webhooks to scheduled draft variant generation. New drafts are inserted idempotently for connected repos, then `internal.generation.populateDraftVariants` is scheduled immediately; existing draft replays skip regeneration. Verified during implementation with `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint`; the user explicitly requested marking this task done.
<!-- SECTION:FINAL_SUMMARY:END -->
