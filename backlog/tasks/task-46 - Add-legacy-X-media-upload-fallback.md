---
id: TASK-46
title: Add legacy X media upload fallback
status: Done
assignee: []
created_date: '2026-06-24 20:43'
updated_date: '2026-06-25 07:56'
labels: []
dependencies: []
priority: high
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Try OAuth 1.0a legacy media upload as a native fallback for TASK-17/TASK-45. If X rejects legacy media upload too, keep native posting text-only and make the draft UI explicit instead of implying image support.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When v2 media upload is forbidden, the backend attempts legacy OAuth 1.0a media upload before returning a media upload error.
- [x] #2 A successful legacy upload stores the returned media ID and posts with media_ids through the existing tweet creation path.
- [x] #3 If both upload paths are forbidden, the UI clearly explains that image upload is unavailable for this X API configuration and keeps text-only posting available.
- [x] #4 Tests cover v2 fallback success, v2 plus legacy forbidden failure, and the text-only fallback copy.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect existing X media upload path, OAuth token storage, and tests.
2. Add failing tests for v2-403 -> legacy success, v2-403 + legacy-403 -> unavailable, and UI text-only fallback copy.
3. Implement the smallest backend fallback from /2/media/upload to upload.twitter.com/1.1/media/upload.json using stored OAuth 1.0a credentials only when present.
4. Preserve existing /2/tweets media_ids posting path and frontend upload truthfulness from TASK-45.
5. Run focused tests, full tests, typecheck, and lint; update acceptance criteria with evidence.
6. Do not mark Done until Matthias confirms manual testing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented native fallback attempt: /2/media/upload still runs first; on 403 and when optional legacy credentials are configured, Dispatch attempts upload.twitter.com/1.1/media/upload.json with OAuth 1.0a and additional_owners set to the connected X user id.
If v2 upload is forbidden and legacy credentials are missing or rejected, the user-facing error now says image upload is unavailable for this X API configuration and the draft UI keeps text-only posting available.
Verification passed: pnpm test -- tests/x-media-upload.test.mjs tests/drafts-review-screen.test.mjs tests/x-oauth.test.mjs tests/error-empty-states.test.mjs; pnpm test (93/93); pnpm exec tsc --noEmit; pnpm lint (0 errors, 4 existing generated Convex warnings).
Task remains In Progress until Matthias confirms manual testing.

Follow-up from X Developer Console on 2026-06-25: current OAuth 2.0 token showed tweet.write, users.read, tweet.read but no media.write. Context7 official X docs list media.write for media uploads, so X_SCOPES now includes media.write. Manual test should first reconnect X via Dispatch settings to mint a fresh OAuth 2.0 token with media.write, then retry image upload. Legacy OAuth 1.0a fallback remains as backup if pay-per-use still rejects media upload.
Verification after scope change passed: pnpm test -- tests/x-oauth.test.mjs; pnpm test -- tests/x-media-upload.test.mjs tests/drafts-review-screen.test.mjs; pnpm test (93/93); pnpm exec tsc --noEmit.

Lint after media.write scope change passed: pnpm lint completed with 0 errors and the existing 4 generated Convex unused eslint-disable warnings.

Correction from 2026-06-25: actual X Developer Console does not display/grant media.write. Context7 official docs confirm the current media path is the v2 chunked upload quickstart using POST /2/media/upload with command=INIT, APPEND, FINALIZE. Next implementation switches Dispatch from single-step /2/media/upload to chunked INIT/APPEND/FINALIZE and restores OAuth scopes to the token scopes X actually grants in the console. Legacy OAuth 1.0a remains backup only.

Implemented correction: uploadTweetImage now uses X v2 chunked upload via POST /2/media/upload with command=INIT, APPEND, FINALIZE. For the current 5MB image limit, Dispatch sends a single APPEND segment_index=0. OAuth scopes restored to the scopes X actually displays/grants in the console: tweet.read tweet.write users.read offline.access. Legacy OAuth 1.0a fallback remains only for a v2 chunked 403 when optional legacy credentials are configured.
Verification passed after chunked switch: pnpm test -- tests/x-media-upload.test.mjs tests/x-oauth.test.mjs tests/drafts-review-screen.test.mjs tests/error-empty-states.test.mjs; pnpm exec tsc --noEmit; pnpm test (93/93); pnpm lint (0 errors, 4 existing generated Convex warnings).

Follow-up diagnostics from 2026-06-25: added safe Convex server logs for X media upload attempts. Each image upload now emits an x-media-upload attemptId, media metadata, whether legacy credentials exist, per-step command success/failure for INIT/APPEND/FINALIZE, legacy fallback start/success/failure, response status, selected X headers, and sanitized/truncated X error fields (type/title/detail/code/count). Logs intentionally avoid access tokens, OAuth secrets, Authorization headers, full response bodies, and uploaded file contents.
Verification after diagnostics passed: pnpm test -- tests/x-media-upload.test.mjs tests/error-empty-states.test.mjs; pnpm exec tsc --noEmit; pnpm test (94/94); pnpm lint (0 errors, 4 existing generated Convex warnings). Task remains In Progress until Matthias confirms manual testing.

Root cause confirmed 2026-06-25 via Convex dev logs: x_media_upload_command_failed at the INIT step with endpoint /2/media/upload, status 403 Forbidden, xErrorTitle/Detail Forbidden, on a 119 KB JPEG (no size/format issue) and hasLegacyCredentials false. A bare 403 at INIT on a Production pay-per-use app where text posting works is the signature of a missing OAuth 2.0 scope. The official X OpenAPI spec requires OAuth2UserToken media.write for every /2/media/upload endpoint, so the earlier removal of media.write (based on the X console not displaying it) was wrong: media.write is requested in the authorize URL and is granted as long as the app is Read and write. Fix: X_SCOPES now includes media.write again (tweet.read tweet.write media.write users.read offline.access). Manual step: disconnect and reconnect X in Dispatch settings to mint a fresh token carrying media.write, then retry the image upload (logs should show x_media_upload_command_succeeded). Legacy OAuth 1.0a fallback remains backup only.

Final correction from manual test on 2026-06-25: the real root cause was the request shape for the current v2 one-shot media upload endpoint, not missing media.write. X OpenAPI v2.166 treats POST /2/media/upload as MediaUploadRequestOneShot requiring media and media_category with additionalProperties=false. The previous command-based INIT/APPEND/FINALIZE fields on /2/media/upload were rejected. The current implementation sends media, media_category=tweet_image, and media_type=image/jpeg-style metadata directly to /2/media/upload; legacy OAuth 1.0a remains as fallback only. Matthias confirmed the upload now works manually.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed draft image upload end to end. The backend now uses the current X v2 one-shot media upload contract for small images, preserves legacy OAuth 1.0a fallback, keeps truthful draft UI fallback states, and has safe diagnostic logs for future X API failures. Manual verification from Matthias: upload works. Fresh verification: focused media/drafts/oauth/error tests passed 26/26; pnpm exec tsc --noEmit passed; pnpm test passed 96/96; pnpm lint passed with 0 errors and 4 existing generated Convex warnings.
<!-- SECTION:FINAL_SUMMARY:END -->
