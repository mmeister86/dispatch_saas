---
id: TASK-24.1
title: 'task-24_01: Assemble landing page skeleton from installed shadcnblocks'
status: Done
assignee: []
created_date: '2026-06-25 15:55'
updated_date: '2026-06-25 16:33'
labels: []
dependencies: []
references:
  - .docs/T-006-positioning-landing-copy.md
modified_files:
  - app/page.tsx
  - tests/landing-block-skeleton.test.mjs
parent_task_id: TASK-24
ordinal: 24001
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Signed-out / route renders installed shadcnblocks in Task-7-aligned order
- [x] #2 No new website copy, color overrides, or block layout customizations are added
- [x] #3 Existing signed-in subscription/paywall/dashboard flow remains intact
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write a failing static test for the signed-out landing block skeleton order in `tests/landing-block-skeleton.test.mjs`.
2. Run `node --test tests/landing-block-skeleton.test.mjs` and confirm it fails because `app/page.tsx` does not yet import/render the installed shadcnblocks sequence.
3. Update `app/page.tsx` minimally: add installed shadcnblocks imports, create `LandingSkeleton`, render it only for `Show when="signed-out"`, and preserve signed-in billing/dashboard flow.
4. Re-run the focused test and full verification commands.
5. Append implementation notes and check acceptance criteria after verification; do not mark the task Done until the user confirms.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the signed-out landing skeleton from installed shadcnblocks on `/` in the required order: Navbar11, Hero233, Feature276, Pricing7, Compare3, Testimonial17, Faq15, Footer24. Added `tests/landing-block-skeleton.test.mjs` to lock order, prevent Contact14 rendering, prevent Task-7 copy injection, and preserve auth/billing markers. Preserved signed-in GuardedApp, paywall checkout handlers, subscriber dashboard link, and UserButton flow. Fixed only lint-blocking template issues in installed block/support files without changing copy, colors, or layouts. Verification: `node --test tests/landing-block-skeleton.test.mjs` passed, `pnpm test` passed 123 tests, `pnpm lint` exited 0 with existing warnings, and `pnpm build` passed outside sandbox after sandboxed Google Fonts fetch failed. Code review subagent reported no actionable findings.

Follow-up centering fix after manual browser review: added a Tailwind v4 `@utility container` definition in `app/globals.css` with `margin-inline: auto` and `padding-inline: 2rem`, matching current Tailwind v4 docs. This addresses the shadcnblocks assumption that `.container` is globally centered, without changing block copy, colors, or component layouts. Added a regression assertion to `tests/landing-block-skeleton.test.mjs`. Verification after the fix: focused test passed 4 tests, `pnpm test` passed 124 tests, `pnpm lint` exited 0 with warnings only, and `pnpm build` passed outside the sandbox.

Second centering follow-up after direct Chrome verification: the first `@utility container` attempt was present in source but did not override the emitted Tailwind `.container` rules in the served CSS. Replaced it with a direct global `.container` rule so the emitted CSS now contains `.container { margin-inline: auto; padding-inline: 2rem; }` after Tailwind's width/max-width container rules. Verified visually in Google Chrome at `localhost:3000/?refresh=container-fix`; the hero cluster is now centered. Fresh verification: focused landing test passed 4 tests, `pnpm lint` exited 0 with warnings only, `pnpm test` passed 124 tests, and `pnpm build` passed outside the sandbox.

Post-merge visual regression fix: scoped the signed-out landing skeleton with `landing-skeleton-light` so installed shadcnblocks keep their default light theme even if Chrome or an ancestor enters a `.dark` context. Added a static regression assertion and verified in Google Chrome that the page is light and centered again. Fresh verification: focused landing test passed 5 tests, `pnpm test` passed 125 tests, `pnpm lint` exited 0 with warnings only, and `pnpm build` passed outside the sandbox.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the signed-out landing page skeleton on `/` from installed shadcnblocks in Task-7-aligned order, preserving the signed-in paywall/subscriber dashboard flow. Added a static regression test for block order, auth/billing markers, no Task-7 copy injection, and the global `.container` centering rule. Fixed lint-blocking template issues and verified visually in Google Chrome that the hero cluster is centered. Verification: focused landing test passed 4 tests, `pnpm lint` exited 0 with warnings only, `pnpm test` passed 124 tests, and `pnpm build` passed outside the sandbox.
<!-- SECTION:FINAL_SUMMARY:END -->
