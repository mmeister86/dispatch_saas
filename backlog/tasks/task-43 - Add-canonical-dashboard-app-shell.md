---
id: TASK-43
title: Add canonical dashboard app shell
status: Done
assignee: []
created_date: '2026-06-22 20:22'
updated_date: '2026-06-24 20:08'
labels: []
dependencies: []
priority: high
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the central /dashboard workspace with shadcn-style non-collapsible sidebar navigation, canonical dashboard subroutes, derived overview data, mock analytics, and legacy redirects from /drafts and /settings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /dashboard renders the canonical app shell with non-collapsible sidebar navigation and secondary Settings navigation
- [x] #2 /dashboard overview shows recent posted drafts, setup/account status, and clearly marked mock analytics using existing Convex data
- [x] #3 /dashboard/drafts, /dashboard/billing, and /dashboard/settings preserve existing draft review, billing, repo, and X account workflows
- [x] #4 Legacy /drafts and /settings redirect to dashboard canonical routes while preserving settings query parameters
- [x] #5 Tests, typecheck, lint, build, and browser verification are run and documented
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write RED source-contract tests for dashboard routes, shadcn sidebar composition, overview data hooks, legacy redirects, and moved billing/settings/drafts links.
2. Run focused tests and confirm they fail for missing dashboard files/routes.
3. Add minimal shadcn-style sidebar primitives or installed sidebar support needed by the dashboard shell.
4. Refactor existing drafts/settings/billing/X panels into dashboard-embedded components while preserving behavior.
5. Add canonical /dashboard pages plus legacy redirects preserving settings query parameters.
6. Run focused tests, full tests, typecheck, lint, build, and browser visual verification.
7. Request code review / evidence pass, fix blockers, then update TASK-43 notes and acceptance criteria.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented canonical dashboard shell and routes on branch codex/dashboard-shell. Added /dashboard, /dashboard/analytics, /dashboard/drafts, /dashboard/billing, /dashboard/settings; legacy /drafts redirects to /dashboard/drafts and /settings preserves search params when redirecting to /dashboard/settings. Added shadcn-style sidebar primitives and dashboard app sidebar, overview, analytics mock data, embedded drafts/settings modes, BillingWorkspace, and moved X account management into settings. Verification: pnpm test passed 89/89; pnpm exec next typegen regenerated route types; pnpm exec tsc --noEmit passed; pnpm lint passed with 0 errors and 4 existing generated Convex warnings; sandboxed pnpm build failed on Turbopack port binding, rerun outside sandbox passed. Browser DOM QA on localhost:3000 verified /dashboard, /dashboard/drafts, /dashboard/settings desktop plus /dashboard at 390px mobile: no horizontal overflow and no console errors. Browser screenshot API timed out, so visual evidence is DOM/viewport/console-based rather than image-based.

Code Reviewer found and re-reviewed three issues. Fixed them with regression tests: /dashboard now gates paid workflow queries behind active currentAccess before mounting listForReview/connectedRepos/connectionStatus; non-active Drafts/Settings/Billing recovery links now return to / so checkout/paywall remains reachable; X OAuth callback redirects to /dashboard/settings with x=connected or x=error. Re-verification after fixes: focused dashboard/x-oauth tests pass; full pnpm test passes 91/91; pnpm exec tsc --noEmit passes; pnpm lint passes with 0 errors and 4 existing generated Convex warnings; pnpm build passes outside sandbox. Browser DOM QA after gating fix verified /dashboard desktop and 390px mobile: no horizontal overflow, no console errors, and no paid workflow data mounted while access is still loading. Reviewer re-review reports no remaining blockers.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the canonical dashboard app shell and dashboard subroutes, with legacy redirects, embedded Drafts/Settings workflows, mock Analytics, billing folded into Settings, and sidebar navigation cleaned up. Verification before finalization: `pnpm test` passed 91/91; `pnpm exec tsc --noEmit` passed; `pnpm lint` passed with 0 errors and the existing generated Convex eslint-disable warnings only.
<!-- SECTION:FINAL_SUMMARY:END -->
