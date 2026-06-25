---
id: TASK-54
title: Route signed-out dashboard visitors through dedicated auth pages
status: Done
assignee: []
created_date: '2026-06-25 19:31'
updated_date: '2026-06-25 19:41'
labels:
  - auth
  - dashboard
  - clerk
dependencies: []
modified_files:
  - middleware.ts
  - app/layout.tsx
  - 'app/login/[[...login]]/page.tsx'
  - 'app/sign-up/[[...sign-up]]/page.tsx'
  - components/dashboard/dashboard-overview.tsx
  - components/dashboard/app-sidebar.tsx
  - tests/auth-wiring.test.mjs
  - tests/dashboard-shell.test.mjs
priority: high
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Signed-out visitors who open the protected Dispatch workspace should not see the dashboard shell or in-dashboard auth card. Add dedicated Clerk-backed /login and /sign-up routes, protect /dashboard and all dashboard subroutes before render, and preserve return-to-dashboard behavior after authentication.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Signed-out requests to /dashboard and /dashboard/* are redirected to the dedicated login route before the dashboard shell renders.
- [x] #2 The app exposes a Clerk-backed /login route for sign-in with /dashboard as the fallback destination.
- [x] #3 The app exposes a Clerk-backed /sign-up route for account creation with /dashboard as the fallback destination.
- [x] #4 ClerkProvider and Clerk auth UI are configured so login and sign-up link to each other and use the dedicated routes.
- [x] #5 Dashboard fallback UI no longer opens Clerk sign-in modals for signed-out users.
- [x] #6 Focused auth/dashboard tests, typecheck, lint, and a browser smoke check verify the behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add failing auth/dashboard source-contract tests for dedicated login/sign-up routes and dashboard route protection.
2. Add Clerk middleware protecting /dashboard and all /dashboard subroutes before the dashboard shell renders.
3. Add branded Clerk-backed /login and /sign-up routes wired to each other with /dashboard fallback redirects.
4. Configure ClerkProvider with the dedicated auth routes and replace dashboard-local sign-in modal fallbacks with /login links.
5. Verify with focused tests, full tests, TypeScript, lint, production build, and browser smoke checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented dedicated Clerk-backed /login and /sign-up routes, Clerk middleware protection for /dashboard(.*), ClerkProvider auth URL configuration, and dashboard fallback links to /login instead of modal SignInButton usage.

Verification:
- RED focused tests failed before implementation for missing middleware/routes/provider props and old SignInButton fallback behavior.
- GREEN focused tests pass: pnpm exec node --test tests/auth-wiring.test.mjs tests/dashboard-shell.test.mjs (14/14).
- Full suite passes: pnpm test (128/128).
- Typecheck passes: pnpm exec tsc --noEmit.
- Lint passes with 0 errors and 13 existing warnings for img usage/generated Convex eslint-disable comments.
- Build passes outside sandbox after Google Font network access: pnpm build.
- Browser smoke check: signed-out /dashboard, /dashboard/drafts, and /dashboard/settings redirect to /login?redirect_url=...; /sign-up renders Clerk sign-up with Dispatch branding.

Notes: Next 16 build emits a warning that the middleware file convention is deprecated in favor of proxy, but the requested Clerk middleware implementation compiles and is recognized as Proxy (Middleware). TASK-54 remains In Progress pending user manual confirmation before Done.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added dedicated Clerk-backed /login and /sign-up routes, configured ClerkProvider with those auth URLs and /dashboard fallbacks, and protected /dashboard plus all subroutes through Clerk middleware before the dashboard shell renders. Replaced dashboard-local signed-out SignInButton modal fallbacks with /login links.

Verification completed before finalization: focused auth/dashboard tests passed 14/14; full pnpm test passed 128/128; pnpm exec tsc --noEmit passed; pnpm lint passed with 0 errors and 13 existing warnings; pnpm build passed outside the sandbox after Google Font network access; browser smoke confirmed signed-out dashboard routes redirect to /login?redirect_url=... and /sign-up renders Clerk sign-up with Dispatch branding.

Note: Next 16 emits a warning that the middleware file convention is deprecated in favor of proxy, but the requested Clerk middleware implementation compiles and is recognized by the build.
<!-- SECTION:FINAL_SUMMARY:END -->
