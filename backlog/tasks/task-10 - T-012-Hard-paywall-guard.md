---
id: TASK-10
title: 'T-012: Hard paywall guard'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 11:06'
labels:
  - imported-from-docs
  - phase-2
  - t-012
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - convex/billing.ts
  - convex/schema.ts
  - tests/auth-wiring.test.mjs
  - tests/billing-wiring.test.mjs
  - tests/schema-contract.test.mjs
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-012
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 non-subscriber is redirected to checkout; subscriber reaches the app.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create a feature branch `feat/t-012-hard-paywall-guard` before implementation.
2. RED: extend tests for the subscription guard contract: schema index, `api.billing.currentAccess` deriving Clerk identity server-side, active/non-expired subscription check, and frontend signed-out/paywalled/subscriber states.
3. GREEN backend: add an indexed active-subscription lookup in Convex that resolves `identity.tokenIdentifier -> users._id -> subscriptions` without accepting client-provided user identifiers.
4. GREEN frontend: replace the diagnostic signed-in screen with guarded states: signed-out sign-in, signed-in non-subscriber Good/Better paywall, active subscriber app shell.
5. Keep checkout creation through the existing `api.billing.createCheckout` action and do not build GitHub/X connection UI in this task.
6. Verify with `pnpm test`, `pnpm lint`, and a production build/type check where feasible. Leave TASK-10 open until Matthias confirms manual testing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation started from the approved plan. The current Lemon Squeezy test subscription should unlock access only when the signed-in Clerk account maps to the same Convex `users._id` stored on the `subscriptions.userId` field.

Implemented the hard paywall guard: added `api.billing.currentAccess`, an indexed active-subscription lookup, and guarded home states for signed-out, paywalled, and active subscriber users. Verification run: `pnpm test` passed 20/20, `pnpm lint` exited 0 with only existing generated Convex warnings, `pnpm exec tsc --noEmit` exited 0, and `pnpm build` exited 0 outside the sandbox after Turbopack hit sandbox process/port restrictions. TASK-10 remains In Progress pending Matthias' manual subscriber/non-subscriber checkout testing.

Addressed code review feedback by adding a server-side duplicate-checkout guard: `createCheckout` now calls internal `hasActiveSubscriptionForUser` and rejects checkout creation for users with an active, non-expired subscription. Re-verified after the fix with `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the hard paywall guard. Signed-out users can sign in, signed-in non-subscribers see the internal Good/Better paywall that opens Lemon Squeezy checkout, and active non-expired subscribers reach the app shell. The public checkout action now also rejects duplicate checkout creation for accounts that already have an active subscription. Verified with pnpm test, pnpm lint, pnpm exec tsc --noEmit, and pnpm build.
<!-- SECTION:FINAL_SUMMARY:END -->
