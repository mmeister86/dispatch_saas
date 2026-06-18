---
id: TASK-4
title: 'T-004: Clerk skeleton with GitHub provider + `ConvexProviderWithClerk` wiring'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 09:14'
labels:
  - imported-from-docs
  - phase-1
  - t-004
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - convex/auth.config.ts
  - convex/viewer.ts
  - components/convex-client-provider.tsx
  - app/layout.tsx
  - app/page.tsx
  - app/globals.css
  - tests/auth-wiring.test.mjs
  - package.json
  - convex/_generated/api.d.ts
  - convex/_generated/api.js
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-004
Phase: Phase 1 — Lock & set up (Sessions 1–3, ~9h)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 user signs in with GitHub via Clerk; `ctx.auth.getUserIdentity()` resolves in a Convex function; session persists across reload.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
T-004 implementation plan approved by user on 2026-06-17.

Goal: Wire Clerk GitHub sign-in to Convex so ctx.auth.getUserIdentity() resolves in a Convex function and the session persists across reload.

Steps:
1. Add convex/auth.config.ts using CLERK_JWT_ISSUER_DOMAIN and applicationID "convex".
2. Add a minimal convex/viewer.ts query that calls ctx.auth.getUserIdentity() and returns null when signed out or safe identity fields when signed in.
3. Add a client-side ConvexClientProvider using ConvexReactClient, ConvexProviderWithClerk from convex/react-clerk, and useAuth from @clerk/nextjs.
4. Wrap app/layout.tsx in ClerkProvider outside ConvexClientProvider.
5. Replace the scaffold home page with a minimal auth verification UI using Clerk signed-in/signed-out controls and the Convex viewer query.
6. Add only the required test setup for this project if feasible without broad scope expansion; otherwise verify with lint/build and manual acceptance instructions.
7. Run pnpm lint and pnpm build. Check AC #1 only after the GitHub sign-in + reload + Convex identity path is verified.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented Clerk + Convex auth skeleton on 2026-06-17. Added Convex auth config, viewer query, ConvexProviderWithClerk client provider, ClerkProvider wrapping, and a minimal home screen for signed-out/sign-in and signed-in Convex identity verification. Added node --test auth wiring checks. Set CLERK_JWT_ISSUER_DOMAIN in local .env.local and Convex dev deployment careful-ox-998. Verification: pnpm test passed (5/5), pnpm lint passed with 3 warnings in Convex generated files, pnpm build passed when run outside sandbox due Turbopack sandbox port-binding restriction. Acceptance criterion is not checked yet because manual GitHub sign-in + reload verification still needs user/browser confirmation.

Started local dev server for manual acceptance check: http://localhost:3000. Smoke check returned HTTP 200. Task remains In Progress until the user confirms GitHub sign-in, Convex identity display, and reload persistence.

Follow-up verified on 2026-06-18: user reported the browser check now shows Convex identity with email, name, and Clerk token identifier. Root cause was missing Clerk JWT template `convex`; created/updated it via Clerk CLI with claims `aud: "convex"`, `email: "{{user.primary_email_address}}"`, and `name: "{{user.full_name}}"`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped Clerk + Convex auth skeleton for TASK-4. The app now wraps ClerkProvider around ConvexProviderWithClerk, defines Convex JWT auth config for Clerk, exposes a viewer query using ctx.auth.getUserIdentity(), and shows a minimal sign-in/identity verification screen. Set CLERK_JWT_ISSUER_DOMAIN in the Convex dev deployment. Verified with pnpm test (5/5), pnpm lint (0 errors, 3 generated-file warnings), and pnpm build.
<!-- SECTION:FINAL_SUMMARY:END -->
