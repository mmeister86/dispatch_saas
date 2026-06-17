---
id: TASK-5
title: 'T-005: Wire `staging` branch + Vercel'
status: In Progress
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-17 08:26'
labels:
  - imported-from-docs
  - phase-1
  - t-005
dependencies: []
references:
  - .docs/backlog.md
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-005
Phase: Phase 1 — Lock & set up (Sessions 1–3, ~9h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `git push origin main:staging` deploys a hello page.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implement via Vercel Git integration, using the existing Next.js app as the hello page. Steps: 1. Verify local prerequisites and required environment variable names without exposing secrets. 2. Run local validation (`pnpm test`, `pnpm lint`, `pnpm build`). 3. Push `main` to remote `staging` with `git push origin main:staging`. 4. Verify whether Vercel access is available locally; if authenticated, inspect/confirm the deployment, otherwise document the required Vercel UI verification. 5. Record deployment evidence or blocker notes in this task. Acceptance criterion #1 is checked only after the Vercel branch deployment URL renders successfully.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Local validation before staging push: `pnpm test` passed (5/5). `pnpm lint` passed with 3 warnings in Convex generated files only. `pnpm build` initially hit a sandbox-only Turbopack permission error, then passed outside the default sandbox. Required Vercel env names present locally: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, plus Convex deployment/site URL values.
<!-- SECTION:NOTES:END -->
