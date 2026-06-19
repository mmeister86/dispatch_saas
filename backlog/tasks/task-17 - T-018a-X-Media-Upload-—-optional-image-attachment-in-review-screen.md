---
id: TASK-17
title: 'T-018a: X Media Upload — optional image attachment in review screen'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-19 07:28'
labels:
  - imported-from-docs
  - phase-2
  - t-018a
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - convex/http.ts
  - convex/x.ts
  - convex/xApi.ts
  - convex/schema.ts
  - convex/_generated/api.d.ts
  - tests/x-media-upload.test.mjs
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-018a
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 user can upload one image in the review screen; it is uploaded via X Media Upload API and attached to the post; text-only remains the default and still works without an image.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement TASK-17 on branch codex/task-16-17-x-posting-media after TASK-16 posting baseline exists, using TDD.
1. Add x-media-upload source-contract tests for POST /x/media/upload auth, ownership/status validation, one image validation, X media upload payload, mediaId storage, and conditional media_ids in tweet creation.
2. Add shared convex/xApi.ts helpers for createXPost and uploadTweetImage.
3. Add authenticated Convex HTTP media upload route in convex/http.ts with multipart/form-data, PNG/JPEG/WebP, 5 MB limit, and internal draft media patch.
4. Update app/page.tsx DraftReviewPanel to upload one image via NEXT_PUBLIC_CONVEX_SITE_URL with Clerk convex JWT, show upload state, and preserve text-only posting as default.
5. Verify with pnpm test, pnpm exec tsc --noEmit, pnpm lint, and pnpm build if UI build dependencies allow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started implementation on codex/task-16-17-x-posting-media. Text-only posting remains the default; media upload is optional and server-side through Convex.

Implemented TASK-17 optional media path on branch codex/task-16-17-x-posting-media. Added authenticated Convex HTTP POST/OPTIONS /x/media/upload, CORS restricted to APP_URL origin, content-length/type/size/duplicate-field/image-signature validation, server-side auth/subscription/ownership/status checks, X Media Upload via POST /2/media/upload with media_category tweet_image, mediaId storage, and conditional media.media_ids when posting. The review UI uploads one optional image with a Clerk convex JWT and keeps text-only posting as the default.

Verification: Context7 rechecked X media docs and confirmed POST /2/media/upload; pnpm test passed 55/55; pnpm exec tsc --noEmit passed; pnpm lint passed with 4 existing generated-file warnings only; pnpm build passed outside sandbox. Backend/code/spec reviewers passed after fixes. Acceptance remains unchecked pending real X manual upload+post confirmation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TASK-17 shipped optional image upload for the review screen. The UI uploads one PNG/JPEG/WebP image with a Clerk Convex JWT to Convex HTTP /x/media/upload while keeping text-only posting as the default. The backend authenticates before parsing uploads, validates content length, exactly one draft id and file, image type/size/signature, active subscription, draft ownership/status, and connected X tokens; uploads media through X /2/media/upload with media_category tweet_image; stores mediaId; and attaches media.media_ids when posting.

Verification: user confirmed manual image upload/posting worked; Context7 confirmed the X media endpoint; pnpm test passed 55/55; pnpm exec tsc --noEmit passed; pnpm lint passed with only existing generated Convex warnings; pnpm build passed outside sandbox; spec/code reviews passed.
<!-- SECTION:FINAL_SUMMARY:END -->
