---
id: TASK-27
title: 'T-033: Pricing block (Good €9 / Better €19, in header)'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 20:36'
labels:
  - imported-from-docs
  - phase-3
  - t-033
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/navbar11.tsx
  - components/pricing7.tsx
  - tests/landing-block-skeleton.test.mjs
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-033
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 two tiers, prices visible in header, CTA to checkout.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. RED: update tests/landing-block-skeleton.test.mjs to assert Dispatch header pricing signal, Good/Better pricing cards, CTA copy, and removal of generic shadcnblocks pricing placeholders.
2. Verify RED with pnpm exec node --test tests/landing-block-skeleton.test.mjs.
3. GREEN: update components/navbar11.tsx with Dispatch brand/nav, Good €9/mo and Better €19/mo header pricing signal, dashboardHref behavior, and public SignInButton CTA.
4. GREEN: update components/pricing7.tsx to monthly-only Good/Better cards from T-006/PRD with SignInButton CTAs and no annual/free/pro placeholder packaging.
5. Verify focused test, full pnpm test, typecheck, lint, and build as needed.
6. Append implementation notes and leave TASK-27 In Progress until Matthias confirms manual acceptance.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified Good €9/mo and Better €19/mo pricing visibility in the header/pricing section. Existing signed-in paywall checkout actions remain wired to Lemon checkout.

Starting TASK-27 implementation from the approved plan. Repo inspection found stale metadata: Pricing7 and Navbar11 still contained generic shadcnblocks pricing/navigation despite the existing checked acceptance criterion.

Implemented TASK-27 pricing cleanup on branch codex/task-27-pricing-block. Replaced generic shadcnblocks Navbar11/Pricing7 placeholder content with Dispatch-specific header pricing signal and monthly-only Good/Better pricing cards from T-006/PRD. Public pricing CTAs intentionally use Clerk SignInButton first; signed-in Lemon checkout remains in the existing PaywallView via api.billing.createCheckout. Strengthened landing source-contract tests to assert Good €9/mo and Better €19/mo in header/pricing, remove Free/Pro/$ placeholders, and prevent public navbar/pricing from importing billing checkout wiring. Review subagent found no blockers; addressed its test-coverage note and updated modified-file metadata. Verification: focused landing/dashboard/settings contracts pass 24/24; pnpm test passes 130/130; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 12 existing warnings outside scoped files; pnpm build passes outside sandbox with existing Next workspace-root and middleware/proxy warnings.

Browser QA note: attempted to start a new dev server on port 3001, but Next refused because an existing dev server process was registered for this repo on port 3000. The existing process was not reachable via curl/browser during final QA, so I did not kill it without explicit permission. Runtime confidence comes from successful pnpm build plus source-contract tests rather than a final live preview.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TASK-27 shipped the Dispatch pricing block and header pricing signal. Navbar11 now uses Dispatch branding, shows Good €9/mo and Better €19/mo in the header, preserves dashboardHref behavior for active subscribers, and sends public CTAs through Clerk sign-in first. Pricing7 now renders monthly-only Good/Better cards from T-006/PRD with no Free/Pro/annual placeholder packaging. Landing source-contract tests now lock the pricing copy and prevent public navbar/pricing from wiring direct checkout APIs. Verification before closing: pnpm test passed 130/130; pnpm exec tsc --noEmit passed; pnpm lint passed with 0 errors and 12 existing warnings outside scoped files; pnpm build passed with existing Next workspace-root and middleware/proxy warnings.
<!-- SECTION:FINAL_SUMMARY:END -->
