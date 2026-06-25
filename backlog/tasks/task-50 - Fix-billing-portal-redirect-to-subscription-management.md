---
id: TASK-50
title: Fix billing portal redirect to subscription management
status: Done
assignee:
  - Codex
created_date: '2026-06-25 12:03'
updated_date: '2026-06-25 12:14'
labels:
  - billing
  - lemon-squeezy
  - bug
dependencies: []
modified_files:
  - convex/billing.ts
  - components/settings-workspace.tsx
  - tests/settings-management.test.mjs
priority: high
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Change the existing Lemon Squeezy billing portal flow so active Dispatch subscribers are sent to Lemon's customer-facing subscription management URL for cancel/upgrade/manage actions instead of a generic portal/dashboard destination. Keep the Convex action server-derived and keep the UI as one button.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Active subscribers clicking the Settings/Billing subscription button are redirected to Lemon Squeezy's subscription management URL when Lemon returns one.
- [x] #2 The Convex action falls back to Lemon Squeezy's customer portal URL if the subscription management URL is missing.
- [x] #3 The portal URL is fetched server-side from the authenticated user's active subscription and is never stored in Convex schema/data.
- [x] #4 Settings/Billing UI copy describes managing the subscription instead of a generic billing portal.
- [x] #5 Targeted billing/settings tests, full test suite, typecheck, and lint pass.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create/switch to feature branch `codex/fix-lemon-billing-portal`.
2. RED: update `tests/settings-management.test.mjs` so the billing portal contract expects `attributes.urls.customer_portal_update_subscription`, verifies fallback to `customer_portal`, and expects user-facing UI copy like `Manage subscription`.
3. Run targeted source-contract tests and confirm they fail for the missing subscription-management URL behavior.
4. GREEN: update `convex/billing.ts` to parse `customer_portal_update_subscription` first, fall back to `customer_portal`, and keep the public `{ url }` return shape unchanged.
5. GREEN: update `components/settings-workspace.tsx` copy/button label to describe subscription management while keeping one button.
6. Run targeted tests: `pnpm exec node --test tests/settings-management.test.mjs tests/billing-wiring.test.mjs`.
7. Run broad verification: `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint`.
8. Record verified acceptance criteria and implementation notes in TASK-50, leaving status In Progress until Matthias manually confirms the real Lemon redirect.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RED confirmed: `pnpm exec node --test tests/settings-management.test.mjs tests/billing-wiring.test.mjs` failed because the UI still said `Open billing portal` and `convex/billing.ts` only read `attributes.urls.customer_portal`, not `customer_portal_update_subscription`.

GREEN verified: backend now prefers `attributes.urls.customer_portal_update_subscription` and falls back to `attributes.urls.customer_portal`; Settings/Billing copy now says `Manage subscription`. Targeted tests passed: `pnpm exec node --test tests/settings-management.test.mjs tests/billing-wiring.test.mjs`. Broad verification passed: `pnpm test` 110/110, `pnpm exec tsc --noEmit`, and `pnpm lint` with 0 errors and 4 existing generated Convex warnings. Independent Code Reviewer found no issues; residual risk is that this repo's billing tests are static source-contract tests rather than mocked Lemon runtime-response tests. TASK-50 remains In Progress until Matthias manually confirms the real Lemon redirect opens the subscription management portal.

After manual retest still landed on `https://app.lemonsqueezy.com/dashboard`, investigated deployment state. The local app uses Convex dev deployment `dev:careful-ox-998`; the prior local commit did not by itself update the cloud function. Ran `pnpm exec convex dev --once --typecheck enable` successfully, deploying the updated `createBillingPortal` function to `https://careful-ox-998.convex.cloud`. Next manual test should distinguish deployed-code issue from Lemon Squeezy admin/customer session behavior.

Matthias explicitly requested marking TASK-50 Done and will have a separate test user validate the real Lemon customer-session redirect. Final status records that caveat: implementation and deployment are complete, while external Lemon session behavior will be tested with a non-admin/customer account.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the Lemon Squeezy subscription management redirect: `createBillingPortal` now fetches the authenticated user's active subscription server-side, prefers Lemon's `customer_portal_update_subscription` signed URL, and falls back to `customer_portal` without storing portal URLs. Updated Settings/Billing copy to `Manage subscription`. Verified targeted tests, full test suite, typecheck, lint, and deployed the updated Convex dev function to `careful-ox-998`. Matthias will have a separate test user confirm the real Lemon customer-session behavior; marking Done per explicit request with that caveat recorded.
<!-- SECTION:FINAL_SUMMARY:END -->
