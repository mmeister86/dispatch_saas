---
id: TASK-16
title: 'T-018: Post to X via API (1-click) + record `xPostId`'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-19 07:28'
labels:
  - imported-from-docs
  - phase-2
  - t-018
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - convex/x.ts
  - convex/xApi.ts
  - convex/drafts.ts
  - convex/schema.ts
  - convex/_generated/api.d.ts
  - tests/x-posting.test.mjs
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-018
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 clicking Post publishes the chosen text; `draft.status=posted` + `xPostId` stored.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement TASK-16 on branch codex/task-16-17-x-posting-media using TDD.
1. Add x-posting source-contract tests for public postDraft auth, ownership/subscription/status/token requirements, POST /2/tweets body, and successful draft patch.
2. Implement Convex posting helpers/actions in convex/x.ts plus shared X API helper if needed.
3. Add convex/drafts.ts listForReview query for the minimal review surface.
4. Update app/page.tsx with a minimal DraftReviewPanel for variants, editing, posting, loading/empty/error/success states.
5. Verify with pnpm test, pnpm exec tsc --noEmit, pnpm lint, and pnpm build if UI build dependencies allow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started implementation on codex/task-16-17-x-posting-media. TASK-17 is implemented in the same integration branch because it extends TASK-16 posting with optional media.

Implemented TASK-16 posting path on branch codex/task-16-17-x-posting-media. Added public Convex action postDraft, internal posting context/claim/mark/recovery mutations, shared X post helper, bounded drafts review query, and minimal review UI. Posting derives identity server-side, requires active subscription and owned draft, refreshes expired X tokens, posts via POST /2/tweets, stores chosenText/status posted/xPostId/postedAt after X success, and uses postingStartedAt to prevent duplicate in-flight posts.

Verification: pnpm test passed 55/55; pnpm exec tsc --noEmit passed; pnpm lint passed with 4 existing generated-file warnings only; pnpm build passed outside sandbox. Backend/code/spec reviewers passed after fixes. Acceptance remains unchecked pending real X manual post confirmation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TASK-16 shipped the one-click X posting path. The subscriber review panel now lists recent drafts, lets the user select/edit a generated variant, and calls the Convex postDraft action. The backend derives identity server-side, verifies active subscription and draft ownership, handles already-posted drafts idempotently, refreshes expired X tokens, prevents duplicate in-flight posts with postingStartedAt, posts through X /2/tweets, and records chosenText/status posted/xPostId/postedAt after X success with a recovery mutation for rare post-succeeded/mark-failed cases.

Verification: user confirmed manual X posting worked; pnpm test passed 55/55; pnpm exec tsc --noEmit passed; pnpm lint passed with only existing generated Convex warnings; pnpm build passed outside sandbox; spec/code reviews passed.
<!-- SECTION:FINAL_SUMMARY:END -->
