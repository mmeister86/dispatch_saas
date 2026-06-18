---
id: TASK-11
title: 'T-013: Connect GitHub repo + register push webhook'
status: Done
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 14:57'
labels:
  - imported-from-docs
  - phase-2
  - t-013
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - app/page.tsx
  - convex/convex.config.ts
  - convex/github.ts
  - convex/http.ts
  - convex/schema.ts
  - convex/_generated/api.d.ts
  - convex/_generated/server.d.ts
  - tests/github-wiring.test.mjs
  - tests/schema-contract.test.mjs
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-013
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 selecting a repo stores it and registers a push webhook on GitHub.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Pivot TASK-11 / T-013 from classic GitHub OAuth to a GitHub App installation flow.

1. RED: Replace GitHub wiring tests so they assert GitHub App env vars, no Clerk OAuth token retrieval, no /user/repos calls, no per-repo /hooks calls, installation-token flow, server-derived auth, and Good/Better repo limits.
2. RED: Update schema contract tests so repos store GitHub App installation metadata instead of webhookId and support multiple repos per user.
3. GREEN backend: Update convex/convex.config.ts with GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_INSTALL_URL, and GITHUB_WEBHOOK_SECRET; remove CLERK_SECRET_KEY from GitHub connect requirements.
4. GREEN schema: Change repos table to store githubInstallationId, optional githubAccountLogin, private/htmlUrl, and add by_userId_and_githubInstallationId.
5. GREEN Convex GitHub module: replace listRepositories/connectRepository with connectedRepos, completeInstallation, and connectInstalledRepository; create GitHub App JWT server-side; exchange it for an installation access token; list installation repositories; enforce Good=1 and Better=5 repos server-side.
6. GREEN UI: replace load-repos OAuth panel with GitHub App install button, installation_id return handling, multi-repo selection, connected repo list, and n/limit tier messaging.
7. Verify with pnpm test, pnpm exec tsc --noEmit, pnpm lint, pnpm build, and pnpm exec convex dev --once. Convex push can only pass after the new GitHub App env vars are set in the Convex dashboard.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the GitHub repo connection flow on branch codex/task-11-github-connect. Added Convex env typing for CLERK_SECRET_KEY, CONVEX_SITE_URL, and GITHUB_WEBHOOK_SECRET; added convex/github.ts with connectedRepo, listRepositories, and connectRepository; added signed /github/webhook ping endpoint; updated the subscriber workspace with a minimal repo picker. GitHub OAuth tokens are fetched from Clerk server-side on demand and are not persisted. Verification passed: pnpm test, pnpm exec tsc --noEmit, pnpm lint (0 errors, existing generated Convex warnings only), and pnpm build outside the sandbox. Acceptance criterion remains unchecked until manual GitHub/Clerk verification confirms repo selection creates the webhook in GitHub.

Follow-up correction after dashboard verification: CONVEX_SITE_URL is a Convex built-in environment variable and cannot be set manually. Removed it from convex.config.ts and changed the webhook URL helper to read process.env.CONVEX_SITE_URL. Only CLERK_SECRET_KEY and GITHUB_WEBHOOK_SECRET need to be manually set for this task. Verification after the fix passed: pnpm test, pnpm exec tsc --noEmit, pnpm lint (0 errors, existing generated Convex warnings only).

Pivot implemented from classic OAuth to GitHub App installation flow. Current implementation removes Clerk OAuth token retrieval and per-repo webhook creation, uses GitHub App JWT + installation access tokens, stores githubInstallationId on repos, and enforces repo limits server-side: Good=1, Better=5. UI now opens the GitHub App install URL, handles return via installation_id, auto-connects a single installed repo, and shows a picker when multiple repos are installed. Verification so far: pnpm test passed (27/27), pnpm exec tsc --noEmit passed, pnpm lint passed with 0 errors and existing Convex generated-file warnings, pnpm build passed outside sandbox. Convex dev push is blocked until GITHUB_APP_ID, GITHUB_APP_INSTALL_URL, and GITHUB_APP_PRIVATE_KEY are set in Convex env.

UI hotfix after manual testing: the GitHub App install control now renders as a real anchor with href={installUrl} instead of a button using window.location.assign(installUrl). This makes navigation robust in the browser and adds a regression assertion in tests/github-wiring.test.mjs. Verification: pnpm test tests/github-wiring.test.mjs passed, pnpm exec tsc --noEmit passed, pnpm lint passed with 0 errors and existing generated-file warnings.

Private key parser hotfix after manual GitHub App installation test: GitHub can provide PKCS#1 PEM keys with -----BEGIN RSA PRIVATE KEY-----. The previous importer only stripped PKCS#8 -----BEGIN PRIVATE KEY----- headers, so atob saw the leading hyphen and threw InvalidCharacterError. Updated convex/github.ts to accept both PEM formats; RSA PRIVATE KEY is wrapped into PKCS#8 before Web Crypto importKey("pkcs8"). Verification: pnpm test tests/github-wiring.test.mjs passed, pnpm test passed (27/27), pnpm exec tsc --noEmit passed, pnpm lint passed with 0 errors and existing generated warnings, pnpm exec convex dev --once successfully pushed functions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented TASK-11 / T-013 as a GitHub App installation flow instead of classic GitHub OAuth. Clerk remains login-only; Convex creates GitHub App JWTs, exchanges them for installation access tokens, lists selected installation repositories, stores connected repos with githubInstallationId, and enforces server-side repo limits of Good=1 and Better=5. The subscriber UI now installs the GitHub App via a real href, handles installation_id returns, auto-connects single-repo installations, and shows connected repo counts. The signed GitHub webhook endpoint is live for ping/push acceptance, with push-to-draft intentionally left for TASK-12.

Manual acceptance completed by the user: GitHub App install flow connected mmeister86/LemonSpace-App and the workspace shows 1/1 repos connected. Verification passed: pnpm test (27/27), pnpm exec tsc --noEmit, pnpm lint (0 errors, existing generated Convex warnings only), and pnpm exec convex dev --once successfully deployed functions after GitHub App env vars were set.
<!-- SECTION:FINAL_SUMMARY:END -->
