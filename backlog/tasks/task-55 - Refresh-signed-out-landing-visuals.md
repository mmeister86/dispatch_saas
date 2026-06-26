---
id: TASK-55
title: Refresh signed-out landing visuals
status: Done
assignee: []
created_date: '2026-06-25 21:52'
updated_date: '2026-06-26 06:13'
labels: []
dependencies: []
priority: high
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refresh the signed-out Dispatch landing page into a distinctive Commit Workbench experience while preserving auth, billing, paywall, dashboard, legal links, and backend behavior. Scope is landing-only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Signed-out landing renders Dispatch-owned landing components instead of generic shadcnblocks composition
- [x] #2 Hero presents a Commit Workbench scene with commit context becoming 2-3 post-ready draft angles
- [x] #3 Primary CTA text remains Get your first draft and uses Clerk SignInButton modal behavior
- [x] #4 Landing typography, colors, spacing, and motion follow .impeccable.md: disciplined indie utility, light-first, black/white/one restrained accent
- [x] #5 Landing motion uses motion/react with reduced-motion handling and no remaining framer-motion imports
- [x] #6 Source-based landing and launch-readiness tests protect the refreshed behavior and anti-placeholder constraints
- [x] #7 pnpm test, pnpm lint, and pnpm build run successfully
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update landing tests first to assert Dispatch-owned landing behavior, Commit Workbench hero, motion/react usage, reduced-motion handling, and preserved auth/footer/legal wiring.
2. Run the focused landing tests and confirm they fail against the current shadcnblocks-style implementation.
3. Replace signed-out landing composition with components/landing/* and keep signed-in paywall/dashboard behavior unchanged.
4. Update typography and landing tokens in app/layout.tsx and app/globals.css using Archivo, Commissioner, OKLCH neutrals/accent, spacing/easing variables, and tighter radii.
5. Migrate landing animation from framer-motion to motion/react with reduced-motion fallback; remove framer-motion dependency if no imports remain.
6. Run focused tests, then pnpm test, pnpm lint, and pnpm build.
7. Run local visual QA on desktop/mobile, record findings, and check acceptance criteria that are verified.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started implementation on branch codex/landing-visual-refresh. User explicitly approved the Landing Visual Refresh Plan in the implementation request. Scope remains signed-out landing only.

Verified RED/GREEN flow: focused landing tests failed before implementation, then passed after the Commit Workbench landing refresh.
Verification passed: pnpm test (132/132), pnpm lint (0 errors, existing Convex generated-file warnings only), pnpm build (success with existing Next workspace-root and middleware warnings).
Visual QA: Arc desktop full-window screenshot reviewed; CTA visible in first viewport and Commit Workbench scene readable. Mobile viewport check at 390x844 shows visible CTA count 2 and no page-level horizontal overflow.
Task intentionally remains In Progress pending user manual review/confirmation before Done.

Addressed code-review findings: scoped the refreshed landing font/color/radius tokens under .landing-page so dashboard/billing/admin keep the baseline app theme; added aria-expanded/aria-controls/id and conditional mounting for the mobile nav panel. Re-ran verification after review fixes: pnpm test passes 132/132, pnpm lint exits 0 with 4 existing Convex generated-file warnings, pnpm build passes after network-enabled next/font fetch. Arc desktop QA on http://localhost:3000 remains clean; mobile metric at 390x844 has horizontalOverflow=false, visibleCtaCount=1, menuExpanded=false, menuHidden=true, mobileNavMountedWhenClosed=false.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the signed-out landing refresh as a Dispatch-owned Commit Workbench landing page, migrated landing animation to motion/react, scoped landing typography/color/radius tokens, preserved auth/paywall/dashboard/legal behavior, removed replaced generic shadcnblocks landing files, updated source tests, and verified pnpm test, pnpm lint, pnpm build, Arc desktop QA, and mobile viewport metrics.
<!-- SECTION:FINAL_SUMMARY:END -->
