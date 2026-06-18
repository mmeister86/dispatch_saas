---
id: TASK-6
title: >-
  T-005a: New free Resend Team + domain for this project, install
  `@convex-dev/resend`
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 15:54'
labels:
  - imported-from-docs
  - phase-1
  - t-005a
dependencies: []
references:
  - .docs/backlog.md
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-005a
Phase: Phase 1 — Lock & set up (Sessions 1–3, ~9h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 a dedicated Resend Team (not reused from another project) is created, domain verified, component installed, and a test email sends via the component's workpool.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Goal: Install and configure the official @convex-dev/resend component for Dispatch, verify usedispat.ch in a dedicated Resend Team, and prove the component workpool can send a test email.

Implementation steps:
1. Add a failing Node source test that asserts Resend wiring: dependency present, convex/convex.config.ts registers the component, and convex/email.ts exposes only an internal test sender using components.resend.
2. Install @convex-dev/resend with pnpm.
3. Add convex/convex.config.ts using defineApp() and app.use(resend) from @convex-dev/resend/convex.config.js.
4. Add convex/email.ts with a Resend(components.resend, {}) instance and internalMutation sendTestEmail that sends from Dispatch <hello@usedispat.ch> to delivered@resend.dev with simple HTML.
5. Run pnpm test, pnpm lint, pnpm build, and pnpm dlx convex dev --once.
6. Trigger internal.email.sendTestEmail from Convex after RESEND_API_KEY is confirmed set; record whether the test email send succeeds.
7. Check acceptance criterion #1 only after the dedicated Resend Team/domain verification and component-backed test send are confirmed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented technical Resend wiring on branch codex-task-6-resend. Added @convex-dev/resend, registered the Convex component in convex/convex.config.ts, added internal email.sendTestEmail using components.resend and Dispatch <hello@usedispat.ch> -> delivered@resend.dev, and added node --test wiring coverage. Validation: pnpm test passed 8/8; pnpm lint passed with existing Convex generated-file warnings only; pnpm build passed outside sandbox after sandbox Turbopack port binding failed; pnpm dlx convex dev --once synced successfully; pnpm dlx convex run email:sendTestEmail exited 0. Acceptance criterion remains unchecked until the user confirms the dedicated Resend Team and usedispat.ch domain verification.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed TASK-6 by installing @convex-dev/resend, registering the official Convex component, adding an internal component-backed test sender from Dispatch <hello@usedispat.ch> to delivered@resend.dev, syncing Convex so components.resend is generated, and adding wiring tests. User confirmed the dedicated Resend Team and usedispat.ch domain are created and verified. Fresh verification before close: pnpm test passed 8/8; pnpm lint passed with 0 errors and 3 existing generated-file warnings; pnpm build passed; pnpm dlx convex run email:sendTestEmail exited 0.
<!-- SECTION:FINAL_SUMMARY:END -->
