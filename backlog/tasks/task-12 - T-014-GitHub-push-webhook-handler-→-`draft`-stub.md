---
id: TASK-12
title: 'T-014: GitHub push webhook handler → `draft` stub'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 15:52'
labels:
  - imported-from-docs
  - phase-2
  - t-014
dependencies: []
references:
  - .docs/backlog.md
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-014
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 a push event creates a `draft` row with commit sha + message.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# Task 12 / T-014: GitHub Push Webhook Creates Draft Stub

## Summary
Implement the existing signed `POST /github/webhook` route so a valid GitHub `push` event creates exactly one `draft` row for the push head commit.

## Key Changes
- Keep the existing GitHub signature check, `ping` handling, and non-push `200 OK` behavior in `convex/http.ts`.
- For `push` events:
  - Parse the raw JSON body only after signature validation.
  - Read `repository.id` to find the connected repo via `repos.by_githubRepoId`.
  - Create one draft for the head commit only, using `head_commit.id/message`; if unavailable, fall back to the commit in `commits[]` whose `id` equals `after`.
  - Insert into `drafts` with `userId`, `repoId`, `commitSha`, `commitMessage`, `variants: []`, and `status: "draft"`.
  - Treat unconnected repos and delete/empty pushes as ignored `200 OK` responses.
  - Make delivery replay idempotent by checking `drafts.by_repoId_and_commitSha` before insert.
- No schema change is expected; existing `drafts` fields and indexes are sufficient.
- Do not overwrite unrelated dirty backlog task changes.

## Public APIs / Interfaces
- No client-facing API changes.
- Existing Convex HTTP endpoint gains push behavior:
  - `POST /github/webhook`
  - Invalid signature: existing unauthorized response.
  - Invalid signed JSON or malformed push payload: `400`.
  - Valid push handled/ignored: `200`.

## Test Plan
- Add/update `tests/github-wiring.test.mjs` checks that:
  - The push TODO marker is removed/replaced with real push handling.
  - `eventName === "push"` is handled.
  - The handler reads `repository.id`, `head_commit.id`, and `head_commit.message`.
  - The handler calls an internal mutation to create the draft.
  - The mutation queries `repos` by `by_githubRepoId`.
  - The mutation checks `drafts.by_repoId_and_commitSha` before insert.
  - The inserted draft has `variants: []` and `status: "draft"`.
- Run `pnpm test`; baseline before implementation was green: 27 passing tests.

## Assumptions
- Multi-commit pushes create only one draft for the head commit.
- Task 12 is a stub-only task; generating tweet variants belongs to Task 14 / T-016.
- Unconnected repository pushes should not cause GitHub retries.
- Current GitHub docs confirm `X-GitHub-Event`, `X-GitHub-Delivery`, `X-Hub-Signature-256`, `repository.id`, `commits[]`, and push head commit payload semantics.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on branch `codex/task-12-github-push-draft-stub`.

Changed `convex/http.ts` so signed GitHub push events parse JSON after signature validation, validate push payload shape, ignore ping/non-push/delete/empty/unconnected repo cases with 200 OK, and create idempotent draft stubs for connected repos using `commitSha`, `commitMessage`, `variants: []`, and `status: "draft"`.

Changed `tests/github-wiring.test.mjs` to cover the push webhook source-contract behavior, payload validation, idempotent draft lookup, bounded multi-repo handling, and no `.unique()` on `by_githubRepoId`.

Verification:
- `pnpm test` passed: 28/28 tests.
- `pnpm lint` passed with 0 errors and 4 existing generated Convex warnings.
- `pnpm build` passed when run outside the sandbox after Turbopack/PostCSS hit a sandbox port-binding limitation.

Reviews:
- Spec compliance reviewer approved after validation/test hardening.
- Code quality reviewer approved after replacing `.unique()` on `by_githubRepoId` with bounded multi-repo processing.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the signed GitHub push webhook handler for T-014.

Summary:
- `/github/webhook` now handles valid `push` events after signature validation and creates `draft` stubs with commit SHA/message, empty variants, and `draft` status.
- Payload parsing is guarded so invalid JSON and malformed push payloads return 400 instead of crashing.
- Replay/idempotency is enforced per connected repo and commit SHA, and repo lookup handles multiple connected rows without `.unique()` failures.

Verification:
- `pnpm test` passed: 28/28.
- `pnpm lint` passed with 0 errors and 4 existing generated Convex warnings.
- `pnpm build` passed outside the sandbox after Turbopack/PostCSS required port-binding permissions.

Reviews:
- Spec compliance review approved.
- Code quality review approved after bounded multi-repo handling was added.
<!-- SECTION:FINAL_SUMMARY:END -->
