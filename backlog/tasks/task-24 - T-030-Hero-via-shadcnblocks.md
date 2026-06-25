---
id: TASK-24
title: 'T-030: Hero via shadcnblocks'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 19:17'
labels:
  - imported-from-docs
  - phase-3
  - t-030
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - tests/launch-readiness.test.mjs
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-030
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 hero block installed; headline + subhead + single CTA live.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD.

1. Verify current shadcn/shadcnblocks setup requirements via Context7 before using the CLI.
2. RED: extend `tests/launch-readiness.test.mjs` to require a shadcnblocks registry in `components.json`, product-led `hero195`/tabbed-preview inspired structure, preserved client-side canned demo, and preserved signed-out CTA/tracking copy.
3. GREEN setup: add minimal `components.json` with the `@shadcnblocks` registry using `Authorization: Bearer ${SHADCNBLOCKS_API_KEY}` and Tailwind 4-compatible paths/aliases.
4. Install `@shadcnblocks/hero195` with `pnpm dlx shadcn@latest add @shadcnblocks/hero195` if the configured registry resolves with the local API key. Review generated files/dependencies before integrating.
5. GREEN landing: redesign only the signed-out marketing surface in `app/page.tsx` around a hero195-inspired tabbed product preview showing Dispatch's commit -> angle -> draft loop. Keep Clerk signed-in flow, Convex paywall/subscriber app, Rybbit tracking, and the public demo client-side on canned data.
6. Refactor/polish: keep the visual system product-led and lean, avoid fake proof, avoid broad unrelated refactors.
7. Verify with `node --test tests/launch-readiness.test.mjs`, `pnpm test`, `pnpm lint`, `pnpm build`, and a local browser check at `localhost:3000`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified the signed-out landing hero with Dispatch headline, subhead, and primary CTA. Verified by `node --test tests/launch-readiness.test.mjs` and full `pnpm test`.

2026-06-25 shadcnblocks research: Context7 resolved `/websites/shadcnblocks` as the best docs source. Current docs show `components.json` must include an `@shadcnblocks` registry at `https://shadcnblocks.com/r/{name}` with `Authorization: Bearer ${SHADCNBLOCKS_API_KEY}`. The repo currently has no `components.json`, so shadcnblocks CLI setup is required before installing blocks. Website scan confirms `hero195` is Basic, updated 2026-06-03, and is a strong fit because its tabbed dashboard preview can show Dispatch's commit -> angle -> draft loop. Supporting block candidates: Pricing 16 or Pricing 3/4 for two plans, Compare 10 for legacy/manual workflow vs Dispatch, and a minimal custom demo/proof section rather than placeholder-heavy testimonials. Preserve signed-in Clerk/Convex/paywall flow and Rybbit tracking while redesigning signed-out marketing content.

2026-06-25 implementation: Added `components.json` with authenticated `@shadcnblocks` registry setup, installed `@shadcnblocks/hero195`, and adapted the generated block into a Dispatch-specific product hero with tabs for Commit, Angle, and Drafts. Redesigned the signed-out landing composition while preserving Clerk signed-in flow, Convex paywall/subscriber app, public canned demo, and Rybbit tracking. Added launch-readiness tests for registry setup and hero195-inspired product preview. Verification: `node --test tests/launch-readiness.test.mjs` passed, `pnpm test` passed 129 tests, `pnpm lint` passed with existing Convex generated-file warnings only, and `pnpm build` passed when rerun outside the sandbox after Turbopack hit a sandbox port-binding restriction. Browser DOM/layout check on localhost:3000 confirmed hero/tabs/CTA render and no horizontal overflow at 1280px desktop or 390px mobile. Screenshot capture via browser plugin timed out twice, so layout verification used rendered DOM measurements instead.

2026-06-25 implementation start: executing focused hero pass from approved plan; preserving completed TASK-24.1 landing skeleton order and signed-in flow.

2026-06-25 focused hero implementation: moved the visible Clerk SignInButton CTA into Hero233, replaced shadcnblocks placeholder hero copy with approved Dispatch headline/subhead/CTA, removed the hidden signed-out fallback CTA from LandingSkeleton, and preserved TASK-24.1 block order plus signed-in billing/dashboard flow. RED/GREEN: landing skeleton test failed before implementation on hidden CTA + placeholder hero copy, then passed after implementation. Verification: node --test tests/auth-wiring.test.mjs tests/landing-block-skeleton.test.mjs passed 11 tests; pnpm test passed 126 tests; pnpm lint exited 0 with existing shadcnblocks/generated warnings only; pnpm build passed outside the sandbox with the existing Next workspace-root warning. Code review subagent reported no actionable findings. Browser plugin reached the local app but Clerk Show content rendered empty in that session, so no visual success claim recorded.

2026-06-25 signed-in / route follow-up: removed the active subscriber intermediate home view shown at / and replaced it with a client-side router.replace("/dashboard") when currentAccess is active. Preserved the signed-in non-active checkout/paywall path by wrapping PaywallView in a centered SignedInPaywallShell with UserButton. Updated tests that previously expected the old Open dashboard/SubscriberApp home view. Review subagent found the bare-paywall regression and stale LandingSkeleton test delimiter; both were fixed. Verification: focused affected tests passed 38 tests; pnpm test passed 126 tests; pnpm lint exited 0 with existing shadcnblocks/generated warnings only; pnpm build passed outside the sandbox with the existing Next workspace-root warning. Arc verification: localhost:3000 redirected to /dashboard for the active logged-in session and showed the dashboard.

2026-06-25 route correction: changed the signed-in active / behavior from forced dashboard redirect to rendering the landing/root page with a Dashboard navbar button. Updated navbar to accept optional dashboardHref for signed-in users, preserved non-active paywall flow, and adjusted regression tests to assert no router.replace("/dashboard"). Verification: focused affected tests passed 38 tests; pnpm test passed 126 tests; pnpm lint exited 0 with 13 existing warnings; pnpm build passed outside the sandbox with the existing Next workspace-root warning. Arc verification confirmed localhost:3000 remains on / for the active signed-in session and the Dashboard navbar button navigates to /dashboard.

2026-06-25 dashboard loading-state correction: removed the visible Dashboard "Loading dashboard" / "Checking access" UI shown after clicking the signed-in navbar Dashboard button. DashboardOverview now returns null while currentAccess is still undefined, renders a real Clerk SignInButton for signed-out dashboard visits, and AppSidebar no longer displays "Checking access" in the account footer. Verification: node --test tests/dashboard-shell.test.mjs passed 7 tests; pnpm test passed 126 tests; pnpm lint exited 0 with 13 existing warnings; pnpm build passed outside the sandbox with the existing Next workspace-root warning. Arc verification confirmed /dashboard renders the active dashboard and sidebar footer with plan/posts instead of the checking-access copy.

2026-06-25 screencast follow-up: reviewed the attached 19s screen recording and identified the remaining flicker as a false signed-out dashboard gate, not the previous explicit checking-access copy. Root cause: Convex currentAccess can briefly report signedOut during navigation while Clerk still has a signed-in user. Fixed DashboardOverview and AppSidebar to use Clerk useUser as the source of truth for whether signedOut is final; if Clerk is signed in and Convex briefly says signedOut, render no gate/footer until access settles. Also changed the real signed-out dashboard copy to "Sign in to open the dashboard." Verification: node --test tests/dashboard-shell.test.mjs passed 7 tests; pnpm test passed 126 tests; pnpm lint exited 0 with 13 existing warnings; pnpm build passed outside the sandbox with the existing Next workspace-root warning; Arc repro from / Dashboard button showed no false Sign in/Subscribe gate and then loaded the active dashboard.

2026-06-25 onboarding loading polish: replaced the brief visible "Checking onboarding." dashboard gate with a shadcn/ui Skeleton-based DashboardOverviewSkeleton. The skeleton mirrors the final dashboard layout with header, metric cards, posts, setup, and analytics placeholders, so slow onboarding status queries no longer flash a textual gate. Context7 docs for /shadcn-ui/ui confirmed the Skeleton import/usage pattern. Verification: node --test tests/dashboard-shell.test.mjs passed 7 tests; pnpm test passed 126 tests; pnpm lint exited 0 with 13 existing warnings; pnpm build passed outside the sandbox with the existing Next workspace-root warning. Arc repro from / Dashboard button did not show the Checking onboarding screen.

2026-06-25 synchronized sidebar loading: added shadcn/ui Skeleton placeholders to AppSidebar for header, navigation, and footer. Sidebar now reads the same onboarding status query as the dashboard overview and uses dashboardSidebarLoading on /dashboard when active access is known but onboarding status is still undefined, so the sidebar and main dashboard content enter the Skeleton loading phase together. Context7 confirmed current shadcn/ui Skeleton import/usage. Verification: node --test tests/dashboard-shell.test.mjs passed 7 tests; pnpm test passed 126 tests; pnpm lint exited 0 with 13 existing warnings; pnpm build passed outside the sandbox with the existing Next workspace-root warning; Arc final dashboard state remained correct.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the TASK-24 landing/dashboard follow-up: signed-out hero CTA is live, the obsolete signed-in root workspace was removed, signed-in users stay on / with a Dashboard navbar button, dashboard access/loading flicker is guarded against Clerk/Convex auth races, and dashboard/onboarding loading now uses synchronized shadcn Skeleton states in the content and sidebar. Verification completed with focused dashboard tests, pnpm test, pnpm lint, pnpm build, and Arc browser checks.
<!-- SECTION:FINAL_SUMMARY:END -->
