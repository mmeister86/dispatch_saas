---
id: TASK-48
title: Add voice-calibrated onboarding first draft
status: Done
assignee:
  - Codex
created_date: '2026-06-25 10:09'
updated_date: '2026-06-25 11:44'
labels:
  - onboarding
  - voice
  - activation
dependencies: []
references:
  - 'https://docs.x.com/x-api/users/get-posts'
  - 'https://docs.github.com/en/rest/commits/commits'
documentation:
  - convex/_generated/ai/guidelines.md
modified_files:
  - convex/schema.ts
  - convex/onboarding.ts
  - convex/generationCore.ts
  - convex/generation.ts
  - convex/github.ts
  - convex/billing.ts
  - components/dashboard/dashboard-overview.tsx
  - components/dashboard/onboarding-workspace.tsx
  - app/dashboard/onboarding/page.tsx
  - tests/schema-contract.test.mjs
  - tests/generation-engine.test.mjs
  - tests/onboarding-flow.test.mjs
  - tests/billing-wiring.test.mjs
  - convex/_generated/api.d.ts
priority: high
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the approved post-subscription onboarding flow for Dispatch. Active subscribers should be guided through mandatory lightweight voice calibration, confirm a derived style profile, connect/select a GitHub repo, import the latest commit, and see a first real generated draft. X import is primary for voice samples, manual paste is the fallback, and raw posts must not be stored permanently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Active subscribers who have not completed onboarding are routed to a guided onboarding flow before the normal dashboard.
- [x] #2 Voice calibration supports importing recent own X posts and manually pasting 3-5 posts, stores only a derived bounded voice profile, and requires confirmation before draft generation.
- [x] #3 The latest commit from a connected GitHub repo can be imported to create or update one onboarding draft using the confirmed voice profile.
- [x] #4 Generated variants still satisfy existing draft generation constraints: 2-3 distinct posts, 280 characters or fewer, and no changelog-speak.
- [x] #5 Tests cover schema/contracts, voice prompt inclusion, X/GitHub endpoint assumptions, onboarding status, and the dashboard/onboarding UI flow.
- [x] #6 Lemon Squeezy checkout redirects successful purchases to /dashboard rather than the root landing route.
- [x] #7 The onboarding X connection step starts the X OAuth flow directly from onboarding instead of sending the user to Settings.
- [x] #8 X OAuth stores a bounded return path in the OAuth state and redirects successful callbacks back to the initiating dashboard route.
- [x] #9 The onboarding voice profile review lets users reject, regenerate, or edit the derived profile before confirmation.
- [x] #10 The onboarding GitHub connection step opens the GitHub App flow directly and preserves return to /dashboard/onboarding after installation callbacks.
- [x] #11 The onboarding repo import creates drafts for up to the five most recent commits instead of only the latest commit.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Refresh current library docs needed for implementation: Convex function/schema patterns and AI SDK structured generation, using Context7 per project rules.
2. Add failing source-contract tests for the voice profile schema, no raw tweet storage, onboarding status/actions, X timeline import endpoint, GitHub latest-commit endpoint, and voice-profile prompt inclusion.
3. Implement backend support: voice profile generation helpers, Convex table/functions, X timeline import helper, GitHub latest commit import, onboarding status, and draft creation/upsert using the confirmed profile.
4. Add failing UI/source tests for dashboard gating and the onboarding route/component, then implement /dashboard/onboarding and dashboard redirect/gate behavior.
5. Run focused tests through RED/GREEN, then full test/typecheck/lint verification; update TASK-48 acceptance criteria and notes with evidence while keeping status In Progress pending user confirmation.

Follow-up from manual review: fix checkout return target and onboarded X connection ergonomics. Add RED tests for Lemon checkout redirect_url = dashboard URL and onboarding using api.x.startConnection/window.location.assign directly; implement smallest code changes; rerun focused tests, full tests/typecheck/lint/build as needed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified the voice-calibrated onboarding first-draft slice on branch codex/voice-calibrated-onboarding. Added derived-only voiceProfiles schema, onboarding Convex status/calibration/confirmation/latest-commit draft actions, optional voice profile support in generation prompts, a /dashboard/onboarding workspace, and dashboard gating for active subscribers who have not reached first-draft activation. Verification: focused onboarding/schema/generation tests pass 24/24; full pnpm test passes 105/105; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 pre-existing generated Convex warnings; pnpm build passes outside sandbox after sandbox EPERM on Turbopack port/process binding; browser smoke check on http://127.0.0.1:3000/dashboard/onboarding shows onboarding content, no horizontal overflow, and no console errors. TASK-48 remains In Progress pending user manual confirmation before Done.

Follow-up fixes from manual review: Lemon Squeezy checkout now sets product_options.redirect_url to APP_URL + /dashboard so successful purchases return to the dashboard instead of the future landing page root. The onboarding X connection step now calls api.x.startConnection directly and assigns the returned OAuth URL, instead of linking to /dashboard/settings. Verification: focused billing/onboarding tests pass 16/16; full pnpm test passes 107/107; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 existing generated Convex warnings; pnpm build passes outside sandbox. TASK-48 remains In Progress pending manual confirmation before Done.

Follow-up fix from manual review: X OAuth now carries a bounded returnPath through the short-lived OAuth state. Settings starts OAuth with /dashboard/settings, onboarding starts with /dashboard/onboarding, and the Convex callback redirects successful connections to the stored initiating dashboard route with a settings fallback for legacy/error cases. Verification: focused x-oauth/onboarding tests pass 17/17; full pnpm test passes 107/107; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 existing generated Convex warnings; pnpm build passes outside sandbox.

Manual review found the voice profile proposal could only be confirmed. Add a small review loop: reject the current derived profile, regenerate from X/manual input, or edit summary/rules before confirming. Keep this within onboarding and do not add profile history or raw post storage.

Follow-up fix from manual review: voice profile review now supports rejecting the current derived profile, regenerating from X, and editing summary/rules before confirmation. Edits clear confirmation and stay bounded; rejecting deletes only the derived profile. Verification: focused onboarding tests pass 9/9; full pnpm test passes 109/109; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 existing generated Convex warnings; pnpm build passes outside sandbox.

Manual review found the GitHub onboarding CTA still sends users to /dashboard/settings before GitHub. Reuse the GitHub connection panel in onboarding, direct the install CTA to GitHub, and preserve the onboarding return path for installation callbacks.

Follow-up fix from manual review: onboarding now embeds the GitHub repository connection panel instead of linking to /dashboard/settings. The GitHub install CTA opens the GitHub App URL directly, stores /dashboard/onboarding as a bounded session return path, and Settings redirects installation callbacks back to onboarding when that return path is present. Verification: focused GitHub/onboarding/settings tests pass 27/27; full pnpm test passes 110/110; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 existing generated Convex warnings; pnpm build passes outside sandbox.

Manual review found onboarding imports only one commit after GitHub repo connection. Expand the first-draft import to a bounded batch of up to five recent commits using GitHub commits per_page=5, creating/upserting one draft per commit.

Follow-up fix from manual review: onboarding repo import now fetches up to five recent commits via GitHub commits per_page=5 and creates/upserts one generated draft per commit using the confirmed voice profile. The onboarding UI now calls importRecentCommitDrafts and labels the action as generating first drafts. Verification: focused onboarding/generation tests pass 22/22; full pnpm test passes 110/110; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 existing generated Convex warnings; pnpm build passes outside sandbox.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the voice-calibrated onboarding first-draft flow. Active subscribers are gated into /dashboard/onboarding, can calibrate voice from X or manual posts, review/edit/reject/regenerate the derived voice profile, connect X and GitHub from onboarding with route-aware return behavior, import up to five recent GitHub commits, and generate first draft variants with the confirmed profile. Lemon Squeezy now redirects paid checkout back to /dashboard. Verification before closing: pnpm test 110/110 passing; pnpm exec tsc --noEmit passing; pnpm lint 0 errors with 4 existing generated Convex warnings; pnpm build passing.
<!-- SECTION:FINAL_SUMMARY:END -->
