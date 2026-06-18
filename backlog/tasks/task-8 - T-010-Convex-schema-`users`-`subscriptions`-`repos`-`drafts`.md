---
id: TASK-8
title: 'T-010: Convex schema: `users`, `subscriptions`, `repos`, `drafts`'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 15:54'
labels:
  - imported-from-docs
  - phase-2
  - t-010
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - convex/schema.ts
  - convex/tsconfig.json
  - convex/_generated/dataModel.d.ts
  - tests/schema-contract.test.mjs
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-010
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 schema typechecks + deploys; tables visible in Convex dashboard.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# T-010: Convex Core Schema Implementation Plan

## Goal
Add the minimal Convex schema for `users`, `subscriptions`, `repos`, and `drafts` so future billing, GitHub, generation, X posting, and UI tasks have typed tables to build on.

## Scope
- Create `convex/schema.ts` with `defineSchema`, `defineTable`, and Convex validators.
- Use Convex `_id` and `_creationTime`; do not duplicate PRD `id`/`createdAt`.
- Store GitHub/X/Lemon IDs as strings.
- Include optional X token fields for future encrypted token storage, but do not implement encryption or OAuth here.
- Do not create a `posts` table; posted tweets are `drafts` with `status: "posted"` and `xPostId`.

## Tables
- `users`: `clerkTokenIdentifier`, `email`, optional `githubId`, optional `xUserId`, optional `xAccessToken`, optional `xRefreshToken`, optional `xConnectedAt`.
- `subscriptions`: `userId`, `lemonCustomerId`, `lemonSubscriptionId`, `plan: "good" | "better"`, `status: "active" | "past_due" | "canceled"`, `currentPeriodEnd`, `postsThisPeriod`.
- `repos`: `userId`, `githubRepoId`, `fullName`, `webhookId`, `connectedAt`.
- `drafts`: `userId`, `repoId`, `commitSha`, `commitMessage`, `variants: string[]`, optional `chosenText`, optional `mediaId`, `status: "draft" | "posted" | "discarded"`, optional `xPostId`, optional `postedAt`.

## Indexes
- `users`: `by_clerkTokenIdentifier`, `by_email`, `by_githubId`, `by_xUserId`.
- `subscriptions`: `by_userId`, `by_lemonCustomerId`, `by_lemonSubscriptionId`, `by_status`.
- `repos`: `by_userId`, `by_githubRepoId`, `by_userId_and_githubRepoId`.
- `drafts`: `by_userId`, `by_userId_and_status`, `by_repoId_and_commitSha`, `by_status`.

## Execution Steps
1. Create branch `codex/t-010-convex-schema`.
2. Add failing `tests/schema-contract.test.mjs` that asserts the four tables, key fields, literal unions, indexes, and no `posts` table.
3. Run `pnpm test` and verify the new test fails because `convex/schema.ts` is missing.
4. Add `convex/schema.ts` with the schema above.
5. Run `pnpm test` and verify the schema contract passes.
6. Run `pnpm exec convex dev --once --typecheck enable` to regenerate Convex generated files and sync to the configured dev deployment.
7. Run `pnpm exec tsc --noEmit` and `pnpm lint`.
8. Verify the synced schema/table names via Convex CLI/dashboard evidence.
9. Commit with message `T-010: add Convex core schema`.

## Acceptance Check
- Schema typechecks and deploys/syncs to Convex.
- `users`, `subscriptions`, `repos`, and `drafts` are visible in the configured Convex dev deployment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation started after user approved the T-010 plan. Context7 Convex docs and local `convex/_generated/ai/guidelines.md` were consulted during planning.

Implemented T-010 schema with TDD. RED: `pnpm test` failed because `convex/schema.ts` was missing. GREEN/final verification: `pnpm test` passed 13/13, `pnpm exec convex dev --once --typecheck enable` succeeded against dev deployment `careful-ox-998`, `pnpm exec tsc --noEmit` exited 0, `pnpm lint` exited 0 with generated-file warnings only, and `pnpm exec convex data` listed `drafts`, `repos`, `subscriptions`, `users`. Code Reviewer found no blocking issues. Reality Checker verdict: PASS; CLI table evidence used instead of visually opening the dashboard.
<!-- SECTION:NOTES:END -->
