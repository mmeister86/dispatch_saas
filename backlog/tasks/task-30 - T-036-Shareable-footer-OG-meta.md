---
id: TASK-30
title: 'T-036: Shareable footer + OG/meta'
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 21:31'
labels:
  - imported-from-docs
  - phase-3
  - t-036
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/layout.tsx
  - components/footer24.tsx
  - components/navbar11.tsx
  - components/hero233.tsx
  - components/feature276.tsx
  - components/compare3.tsx
  - components/testimonial17.tsx
  - components/faq15.tsx
  - public/og-dispatch.svg
  - public/og-dispatch.png
  - tests/launch-readiness.test.mjs
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-036
Phase: Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 footer + correct social preview card.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
TASK-30: Shareable footer + OG/meta

Approved scope: keep this task small. Update the existing Footer24 component with Dispatch-specific footer content, add canonical/Open Graph/Twitter metadata for https://usedispat.ch, and add SVG+PNG social preview assets. Do not add a changelog route.

Implementation steps:
1. RED: add a small tests/launch-readiness.test.mjs contract test that checks footer copy/links, removal of obvious shadcn placeholders, metadata fields, and existence of public/og-dispatch.svg plus public/og-dispatch.png.
2. GREEN: update components/footer24.tsx in place with Dispatch, Built in public by @matthias_builds, https://x.com/matthias_builds, /impressum, and /datenschutz.
3. GREEN: update app/layout.tsx metadata with metadataBase https://usedispat.ch, canonical /, Open Graph metadata, Twitter card metadata, and /og-dispatch.png image reference.
4. GREEN: add public/og-dispatch.svg as editable source and public/og-dispatch.png as social-compatible metadata image.
5. Verify only the requested checks: pnpm test tests/launch-readiness.test.mjs and pnpm lint. Skip broad/exhaustive tests for this task.
6. Leave acceptance criterion unchecked until production social preview is manually validated after deploy.

Assumptions: production URL is https://usedispat.ch; build-log destination is https://x.com/matthias_builds; Next.js metadata docs via ctx7 may be skipped if approval is unavailable, using conservative App Router metadata patterns instead.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Footer, OG/Twitter metadata, canonical URL, and OG asset are implemented and covered by launch-readiness tests. Acceptance remains unchecked until the social preview card is validated against the production URL; SVG may need PNG/JPG fallback for X/social validators.

Implemented the approved small-scope plan on branch codex/task-30-shareable-footer-og. RED confirmed with pnpm test tests/launch-readiness.test.mjs failing before implementation. GREEN confirmed with the focused launch-readiness test passing. pnpm lint exits 0 with existing warnings in generated Convex files only. Acceptance criterion remains unchecked until production social preview is manually validated after deploy. Context7 Next.js lookup was attempted but blocked by the sandbox reviewer, so metadata uses conservative App Router Metadata object patterns.

Refined footer after visual review: large Dispatch heading is now left-aligned, footer navigation labels are English, and footer links mirror the landing sections with anchors for Home, Problem, How it works, Pricing, Comparison, Proof, and FAQ plus English legal labels for Legal notice and Privacy policy. Focused launch-readiness test passes with 3/3 tests; pnpm lint exits 0 with the same generated Convex warnings.

Tightened footer bottom-link spacing after visual review: replaced the wide grid distribution with a compact wrapping flex row using gap-x-5/gap-y-3. Focused launch-readiness test remains green with 3/3 tests; pnpm lint exits 0 with the same generated Convex warnings.

Mirrored the non-legal footer section links into the navbar: Home, Problem, How it works, Pricing, Comparison, Proof, and FAQ. Legal notice and Privacy policy remain footer-only. Focused launch-readiness test passes with 4/4 tests; pnpm lint exits 0 with the same generated Convex warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the shareable landing footer and social metadata. Footer now uses Dispatch-specific copy, build-in-public X link, English landing/legal links, compact footer spacing, and matching non-legal section links in the navbar. Added canonical/Open Graph/Twitter metadata for https://usedispat.ch plus SVG/PNG OG assets. Verified with focused launch-readiness tests and lint; production social preview should still be manually validated after deploy because crawlers/cache behavior cannot be proven locally.
<!-- SECTION:FINAL_SUMMARY:END -->
