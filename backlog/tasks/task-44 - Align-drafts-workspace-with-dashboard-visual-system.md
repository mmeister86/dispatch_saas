---
id: TASK-44
title: Align drafts workspace with dashboard visual system
status: Done
assignee:
  - Codex
created_date: '2026-06-24 19:43'
updated_date: '2026-06-24 20:08'
labels: []
dependencies: []
modified_files:
  - components/drafts-workspace.tsx
  - components/settings-workspace.tsx
  - components/dashboard/app-sidebar.tsx
  - components/ui/sidebar.tsx
  - app/dashboard/billing/page.tsx
  - tests/drafts-route.test.mjs
  - tests/drafts-review-screen.test.mjs
  - tests/dashboard-shell.test.mjs
  - tests/settings-management.test.mjs
priority: high
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the routed /dashboard/drafts workspace feel consistent with the rest of the dashboard shell instead of retaining the old standalone dark draft-board treatment. Preserve the existing draft selection, editing, upload, and posting workflow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /dashboard/drafts uses the same header, card, spacing, border radius, and neutral dashboard styling as Analytics and Dashboard overview.
- [x] #2 Draft list, variant selection, text editing, optional image upload, post readiness messaging, notices, and errors remain available in the routed dashboard workspace.
- [x] #3 Relevant tests are updated and pass for the dashboard draft route and review screen.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Compare DraftsWorkspace with Analytics/Dashboard overview styling and identify old standalone-shell classes that cause visual mismatch.
2. Refactor the embedded /dashboard/drafts layout into dashboard-native sections: header, draft list card, editor card, and neutral empty/loading/access states.
3. Preserve existing data flow and controls for draft selection, variants, editing, optional image upload, posting, notices, errors, and cap messaging.
4. Update route/review tests that assert the old dark/warm visual treatment so they instead guard the dashboard-native structure.
5. Run focused tests for drafts route/review/inbox and a broader verification command if practical.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Refactored the embedded /dashboard/drafts workspace from the old standalone dark/warm shell into dashboard-native header, draft queue card, and draft detail card styling. Preserved existing draft selection, variant editing, upload, posting readiness, notice, and error flows.

Code Reviewer subagent found one accessibility issue: nested main landmarks in embedded dashboard mode. Fixed by rendering a conditional root element (`div` when embedded, `main` when standalone) and updated route tests to guard against hard-coded `<main>`.

Verification passed: `pnpm exec node --test tests/drafts-route.test.mjs tests/drafts-review-screen.test.mjs tests/drafts-inbox.test.mjs`; `pnpm exec tsc --noEmit`; `pnpm lint` (0 errors, existing generated Convex unused eslint-disable warnings only). Browser read-only check on /dashboard/drafts reached the unauthenticated/subscription gate, confirming no old dark/warm shell classes there; authenticated draft detail visual state could not be inspected in the in-app browser session.

Removed the extra Settings link from the /dashboard/drafts page header so the Drafts header matches the simpler Analytics header shape. Verification passed: `pnpm exec node --test tests/drafts-route.test.mjs tests/drafts-review-screen.test.mjs` and `pnpm exec tsc --noEmit`.

Adjusted dashboard sidebar active link styling so the active route applies color on the actual Link element (`text-white`) and exposes `aria-current="page"`. Verification passed: `pnpm exec node --test tests/dashboard-shell.test.mjs` and `pnpm exec tsc --noEmit`.

Clarified the left dashboard sidebar active-link fix: the visible SidebarMenuButton now inherits `currentColor`, while the wrapping Next Link owns the active/inactive text color and `aria-current`. Verification passed: `pnpm exec node --test tests/dashboard-shell.test.mjs` and `pnpm exec tsc --noEmit`.

Removed the left sidebar Secondary group and moved Settings into the primary Workspace navigation directly below Billing. Verification passed: `pnpm exec node --test tests/dashboard-shell.test.mjs` and `pnpm exec tsc --noEmit`.

Aligned the /dashboard/settings workspace with the rest of the dashboard visual system: removed its duplicate header navigation/UserButton, switched the embedded root away from nested main, changed the header/card/buttons/rows to zinc/white dashboard styling, and normalized the adjacent billing gate styles in the same file. Verification passed: `pnpm exec node --test tests/settings-management.test.mjs tests/dashboard-shell.test.mjs`, `pnpm exec tsc --noEmit`, and a targeted grep confirmed no old settings header/UserButton/black utility patterns remain in `components/settings-workspace.tsx`.

Moved billing into Settings and removed the separate Billing sidebar entry. `/dashboard/settings` now renders `BillingPortalPanel` after account/repo settings, and `/dashboard/billing` redirects to `/dashboard/settings`. Verification passed: `pnpm exec node --test tests/dashboard-shell.test.mjs tests/settings-management.test.mjs`, `pnpm exec tsc --noEmit`, and targeted grep confirmed no live `/dashboard/billing` sidebar link or old billing placeholder remains.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aligned the dashboard workspaces visually: Drafts and Settings now use the shared dashboard header/card/sidebar language, active sidebar links inherit the correct color, Secondary was removed, Settings moved under Workspace navigation, and Billing now lives inside Settings while `/dashboard/billing` redirects. Verification before finalization: `pnpm test` passed 91/91; `pnpm exec tsc --noEmit` passed; `pnpm lint` passed with 0 errors and the existing generated Convex eslint-disable warnings only.
<!-- SECTION:FINAL_SUMMARY:END -->
