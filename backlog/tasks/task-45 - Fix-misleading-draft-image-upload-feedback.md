---
id: TASK-45
title: Fix misleading draft image upload feedback
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-24 20:13'
updated_date: '2026-06-25 07:56'
labels:
  - bug
  - drafts
  - x-media
dependencies: []
references:
  - TASK-17
modified_files:
  - components/drafts-workspace.tsx
  - tests/drafts-review-screen.test.mjs
  - tests/x-media-upload.test.mjs
  - convex/x.ts
  - tests/x-oauth.test.mjs
priority: high
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix the draft review screen so selecting an optional image only appears attached after the direct X media upload succeeds. This is follow-up bug work for TASK-17: the intended model remains direct upload to X on file selection, without Convex file storage or deferred upload on Post.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When a selected image fails to upload, the file input is reset and the UI clearly says the image was not attached.
- [x] #2 When an image upload succeeds, the UI immediately shows Image attached before waiting for the drafts query to refresh.
- [x] #3 After an image upload fails because X must be reconnected, text-only posting remains available and the readiness message makes that explicit.
- [x] #4 Existing direct-to-X media upload behavior and posting with media IDs remain covered by tests.
- [x] #5 After a successful X reconnect, stale draft image upload reconnect errors are cleared so the user can choose the image again from a truthful neutral state.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add failing source-contract coverage in tests/drafts-review-screen.test.mjs for upload failure reset state, non-attached failure copy, reconnect guidance, and text-only readiness after a failed image upload.
2. Run the focused drafts/media tests and confirm the new assertions fail for the current implementation.
3. Update components/drafts-workspace.tsx to track per-draft media upload UI state separately from persisted draft.mediaId: idle, uploading, attached, and failed.
4. Reset the file input after failed uploads using a keyed input or equivalent, show clear failure copy, and keep text-only posting available with explicit readiness messaging.
5. Show Image attached immediately after successful upload before the Convex drafts query refreshes, while preserving existing direct-to-X upload and post mediaId flow.
6. Run focused tests, then full test/type/lint verification. Check acceptance criteria as they are verified; do not mark Done until user confirms manual testing.

7. Fix the reconnect-after-failure loop: expose a non-secret X connected timestamp from connectionStatus, subscribe to it in the drafts workspace, and clear only reconnect-class upload failures when that timestamp changes after a failed upload. Cover this with failing tests before implementation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented truthful image upload feedback for the drafts review screen. The UI now tracks per-draft upload state separately from persisted draft.mediaId, resets the file input on failed upload, shows Image attached immediately after successful direct-to-X upload, and keeps text-only posting available after failure. Follow-up review found reconnect guidance was too broad, so upload recovery is now split between retry and reconnect; reconnect copy appears only for X upload auth/connection failures. Verification: pnpm test passed 91/91; pnpm exec tsc --noEmit passed; pnpm lint passed with 0 errors and 4 existing generated Convex warnings.

Addressed the after-reconnect loop reported from manual testing. Root cause: connectionStatus only exposed connected=true before and after OAuth, so the drafts screen had no observable signal that X tokens were refreshed and kept stale reconnect upload errors. Fix: connectionStatus now exposes non-secret xConnectedAt, DraftsWorkspace watches that timestamp and clears only reconnect-class upload failures when it changes. Also split X media upload 401 vs 403: 401 still asks for reconnect; 403 now reports X app permissions/API access instead of incorrectly saying the connection expired. Verification: pnpm test passed 91/91; pnpm exec tsc --noEmit passed; pnpm lint passed with 0 errors and 4 existing generated Convex warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed misleading draft image upload feedback. Failed uploads reset the file input and do not imply media is attached, successful uploads immediately show Image attached, reconnect/unavailable states have explicit copy, and text-only posting remains available when media upload fails. Manual verification from Matthias: image upload now works after the backend contract fix. Fresh verification: focused media/drafts/oauth/error tests passed 26/26; pnpm exec tsc --noEmit passed; pnpm test passed 96/96; pnpm lint passed with 0 errors and 4 existing generated Convex warnings.
<!-- SECTION:FINAL_SUMMARY:END -->
