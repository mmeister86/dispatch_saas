---
id: TASK-33
title: 'T-041: Wire Rybbit funnel tracking'
status: To Do
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-25 14:36'
labels:
  - imported-from-docs
  - phase-4
  - t-041
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/analytics/rybbit-events.ts
  - components/analytics/rybbit.tsx
  - app/layout.tsx
  - app/page.tsx
  - components/dashboard/dashboard-overview.tsx
  - convex/billing.ts
  - tests/launch-readiness.test.mjs
  - tests/billing-wiring.test.mjs
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-041
Phase: Phase 4 — Proof, legal & analytics (Sessions 25–28, ~12h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 landing visit → demo interaction → signup → paid conversion are each tracked as distinct events in Rybbit.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement on branch `codex/launch-readiness-30-36` using TDD and Context7 docs. RED: test Rybbit helper/event names for `landing_visit`, `demo_interaction`, `signup_intent`, `paid_conversion`. GREEN: add guarded client helper using `window.rybbit.event(...)`, install env-driven script, fire landing/demo/signup/paid-conversion events. Keep separate from Convex/X analytics. Verify focused tests, `pnpm test`, and manual browser console behavior when env is configured.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rybbit client helper, script component, and funnel event calls are implemented and covered by tests. Acceptance remains pending until `NEXT_PUBLIC_RYBBIT_SITE_ID` and `NEXT_PUBLIC_RYBBIT_SCRIPT_SRC` are configured and live events are verified in Rybbit.
<!-- SECTION:NOTES:END -->
