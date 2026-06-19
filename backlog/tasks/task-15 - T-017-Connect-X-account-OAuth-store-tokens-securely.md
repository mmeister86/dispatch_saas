---
id: TASK-15
title: 'T-017: Connect X account (OAuth) + store tokens securely'
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-19 06:49'
labels:
  - imported-from-docs
  - phase-2
  - t-017
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - convex/x.ts
  - convex/http.ts
  - convex/schema.ts
  - convex/convex.config.ts
  - convex/_generated/api.d.ts
  - convex/_generated/server.d.ts
  - app/page.tsx
  - tests/x-oauth.test.mjs
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-017
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 user authorizes X; tokens stored server-side; refresh works.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# TASK-15 X OAuth Connection Plan

## Summary
Implement X account connection through Convex using OAuth 2.0 Authorization Code + PKCE. A signed-in paid user starts OAuth from the app, Convex creates a short-lived PKCE state, X redirects to a Convex HTTP callback, and Convex exchanges the code for access/refresh tokens stored only server-side.

## Key Changes
- Add `convex/x.ts` with `connectionStatus`, `startConnection`, internal token storage, OAuth state consumption, and refresh helpers.
- Extend schema with `xOAuthStates` plus user token metadata (`xTokenExpiresAt`, optional `xUsername`).
- Add env vars `X_CLIENT_ID`, `X_CLIENT_SECRET`, and `X_OAUTH_REDIRECT_URI`.
- Add `GET /x/oauth/callback` in `convex/http.ts` to validate state, exchange code, fetch `/2/users/me`, store tokens, and redirect to `APP_URL`.
- Add a compact X account panel in `app/page.tsx`; no tokens are exposed to the client.

## Tests
- Add `tests/x-oauth.test.mjs` for env vars, Convex exports, server-derived identity, PKCE URL shape, refresh grant, token rotation storage, public-query safety, HTTP callback route, and UI wiring.
- Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint`.

## Assumptions
- Secure storage for v1 means server-only Convex storage, not app-level encryption or an external secret store.
- Scopes are `tweet.write users.read offline.access`; `media.write` stays out of scope for TASK-15.
- Posting to X remains TASK-16.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented TASK-15 X OAuth connection with Convex-only OAuth 2.0 Authorization Code + PKCE. Added `convex/x.ts`, `GET /x/oauth/callback`, X env vars, `xOAuthStates`, user token metadata, and a subscriber X account panel. Tokens remain server-side and public query returns only connected state plus optional username. After subagent review, fixed the browser authorize URL to `https://x.com/i/oauth2/authorize`, switched confidential-client token and refresh requests to Basic Auth, bounded callback `code`/`state`, removed upstream response bodies from thrown X errors, replaced prior per-user OAuth states before inserting, deletes expired consumed state, and hardened callback redirects with `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Verification: `pnpm test` passed 46/46; `pnpm exec tsc --noEmit` exited 0; `pnpm lint` exited 0 with 4 existing generated-file warnings only. TASK-15 remains In Progress pending real X OAuth env setup/manual authorization confirmation before marking Done.

Debugged X OAuth callback returning `?x=error`. Convex logs showed `X profile request failed: 403` from `fetchXProfile`, meaning token exchange succeeded but `/2/users/me` rejected the access token. Root cause: OAuth scopes omitted `tweet.read`; X user-context profile/read endpoints expect `tweet.read` with `users.read`. Added RED test requiring `tweet.read tweet.write users.read offline.access`, updated `X_SCOPES`, and verified `pnpm test tests/x-oauth.test.mjs` 8/8, `pnpm test` 46/46, `pnpm exec tsc --noEmit` exit 0, `pnpm lint` exit 0 with existing generated warnings only. User must re-authorize X after redeploy because previously issued tokens lack the new scope.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TASK-15 shipped X account connection via Convex-only OAuth 2.0 Authorization Code + PKCE. The flow creates server-side PKCE state, redirects through X, exchanges the callback code in Convex, stores access/refresh tokens only on the server, supports refresh-token rotation, and exposes only safe connected state plus optional username to the client. The subscriber workspace now shows the connected X handle. Security/code review fixes were incorporated: correct browser authorization URL, Basic Auth for confidential token exchange, bounded callback input, no upstream response bodies in thrown X errors, OAuth-state replacement, expired-state deletion, and no-store/no-referrer callback redirects. Verification: `pnpm test` passed 46/46; `pnpm exec tsc --noEmit` exited 0; `pnpm lint` exited 0 with only existing generated Convex warnings. Manual acceptance confirmed by successful connection of `@matthias_builds` and redirect to `?x=connected`.
<!-- SECTION:FINAL_SUMMARY:END -->
