---
id: TASK-22
title: 'T-022: Settings: manage repo + subscription'
status: Done
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-22 13:11'
labels:
  - imported-from-docs
  - phase-2
  - t-022
dependencies: []
references:
  - .docs/backlog.md
modified_files:
  - components/settings-workspace.tsx
  - tests/settings-management.test.mjs
  - tests/github-wiring.test.mjs
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-022
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 connect/disconnect repo; link to Lemon Squeezy billing portal.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# TASK-22: Settings Manage Repo + Subscription

Implement a dedicated /settings route for active subscribers to manage connected GitHub repos and their Lemon Squeezy subscription.

1. Add tests/settings-management.test.mjs as a RED source-contract test covering the new route, Convex public interfaces, auth-derived ownership, local-only repo disconnect, Lemon Squeezy subscription portal fetch, and navigation links.
2. Add api.github.disconnectRepo({ githubRepoId }) returning { disconnected: boolean }; derive identity server-side, require active subscription, delete only the signed-in user's matching repos row, preserve drafts, and do not mutate GitHub remotely.
3. Add api.billing.createBillingPortal({}) returning { url }; derive identity and active subscription server-side, fetch https://api.lemonsqueezy.com/v1/subscriptions/{lemonSubscriptionId}, return attributes.urls.customer_portal, and never store portal URLs.
4. Add /settings via a settings workspace component. Active users can connect repos through the existing GitHub App install flow, disconnect repos, see plan usage/renewal, and open the billing portal. Signed-out/unpaid users see a small gated state linking back to sign-in/checkout.
5. Add Home and Drafts navigation links to /settings while keeping the routed drafts workspace intact.
6. Verify with pnpm test, pnpm exec tsc --noEmit, pnpm lint, pnpm build, and Convex typecheck/deploy check where env permits.

Assumptions: /settings is the canonical management surface; disconnect only removes Dispatch's local repo connection; old drafts remain; no new env vars, schema tables, services, or dependencies.

Follow-up approved by user on 2026-06-22: make repo connection management visible in /settings. TDD steps: (1) update settings/github source-contract tests to require a visible "Load GitHub repositories" CTA, a "Manage GitHub App access" link, and a Connected state for already-connected installed repos; (2) run focused tests and confirm they fail; (3) minimally update components/settings-workspace.tsx without changing Convex schema or adding GitHub user tokens; (4) rerun focused tests plus full pnpm test, tsc, lint, and Convex typecheck where env permits; (5) leave TASK-22 In Progress until user manually validates the GitHub flow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented TASK-22 on branch codex/task-22-settings.

Shipped:
- Added a dedicated /settings route with repo management and Lemon Squeezy billing portal access.
- Moved GitHub repo management out of Home; Home and Drafts now link to Settings.
- Added api.github.disconnectRepo for local-only repo disconnect scoped to the signed-in user.
- Added api.billing.createBillingPortal to fetch a fresh Lemon Squeezy subscription customer_portal URL server-side.
- Added durable GitHub installation tracking on users.githubInstallationId so users can reopen the installed repo picker after the initial GitHub App callback.
- Fixed downgrade/over-limit handling: connectedRepos returns all local repo rows up to product max so extra repos remain visible and disconnectable.
- Fixed legacy Good-plan switch-repo path by preserving a repo row's githubInstallationId before deleting it.

Verification:
- pnpm test tests/settings-management.test.mjs: PASS 7/7.
- pnpm test: PASS 75/75.
- pnpm exec tsc --noEmit: PASS.
- pnpm lint: PASS with 4 existing generated Convex unused eslint-disable warnings.
- pnpm build: PASS outside sandbox; sandbox build hit the known Turbopack port-binding restriction.
- pnpm exec convex dev --once --typecheck enable: PASS; Convex functions ready, with existing AI-files stale notice.

Reviews:
- Reality Checker passed the TASK-22 acceptance shape, with manual checks still required for real GitHub install redirect, local disconnect, and Lemon Squeezy portal redirect.
- Code review blocker for over-limit hidden repos was fixed and re-reviewed.
- User-reported one-time repo picker issue was fixed by durable installation tracking and the Choose installed repo path.

Known follow-up/risk:
- GitHub docs say setup URL installation_id can be spoofed and should be verified with a user access token. The current GitHub App flow predates TASK-22 and intentionally avoids GitHub user OAuth tokens per T-013; a proper fix needs a separate security task/design rather than a fake local patch.

User validation after implementation: /settings still shows only Install GitHub App and no visible repo chooser for the current account state (0/5 repos connected). Task must remain In Progress. Current WIP is being committed/pushed for handoff, but repo selection UX/flow still needs follow-up before acceptance can be checked.

Starting approved TASK-22 follow-up: repo selection UI remains too hidden after GitHub App install. Implementation will keep the current Convex/GitHub-App model and make installed repository loading/access management explicit in settings.

TASK-22 follow-up implemented on 2026-06-22. Settings repo UI now separates states: first-time users see Install GitHub App; users with a remembered installation see Load GitHub repositories and Manage GitHub App access; loaded installed repos that are already locally connected render as Connected instead of connectable. No Convex schema/API expansion, no GitHub user token/OAuth scope added. Verification: focused settings-management 8/8 pass, focused github-wiring 8/8 pass, full pnpm test 76/76 pass, pnpm exec tsc --noEmit pass, pnpm lint pass with 4 existing generated Convex warnings, pnpm exec convex dev --once --typecheck enable pass with existing Convex AI-files stale notice. Code Reviewer subagent found no issues; residual risk remains real GitHub installation/manage URL manual validation. Acceptance criterion intentionally left unchecked until user validates manually.

User validation still fails: GitHub App is installed at github.com/settings/installations/141137818, but Dispatch shows only Install GitHub App because no githubInstallationId is stored locally. Context7 GitHub docs confirm setup_url supplies installation_id after install, and update redirects depend on GitHub App configuration. Adding a TDD recovery path in settings to load an already-installed GitHub App from a GitHub installation URL or numeric installation id, reusing api.github.completeInstallation and avoiding schema/API expansion.

TASK-22 follow-up revised after user screenshot on localhost. Root cause: GitHub App is installed at github.com/settings/installations/141137818, but Dispatch has no locally remembered githubInstallationId, so production-safe UI can only show Install GitHub App. Attempted arbitrary installation ID recovery was rejected by Code Reviewer as unsafe because api.github.completeInstallation trusts client-provided installation_id. Final implementation keeps production UI on the GitHub setup/update redirect path, and adds a local-development-only recovery form that renders only on localhost/127.0.0.1, accepts only full github.com/settings/installations/<digits> URLs (no naked IDs, no arbitrary domains), and reuses completeInstallation to remember/load the installation for local testing. Also kept visible Load GitHub repositories / Manage GitHub App access CTAs and Connected state for already-connected installed repos. Verification: settings-management 9/9 pass, github-wiring 8/8 pass, full pnpm test 77/77 pass, pnpm exec tsc --noEmit pass, pnpm lint pass with 4 existing generated Convex warnings, pnpm exec convex dev --once --typecheck enable pass with existing AI-files stale notice. Re-review found no issues; residual non-blocking note: completeInstallation still trusts callback installation_id and should get a separate security task if/when GitHub user-token verification is in scope. TASK-22 remains In Progress pending manual browser validation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TASK-22 shipped the settings management surface for repositories and billing.

Summary:
- Added /settings repo and subscription management with local-only repo disconnect, Lemon Squeezy billing portal access, and navigation from Home/Drafts.
- Made GitHub repo management visible after installation: active users can load repositories from a remembered GitHub App installation, manage GitHub App access, see connected repos, and identify already-connected installed repos.
- Added a localhost-only development recovery form for the observed case where GitHub opens github.com/settings/installations/<id> instead of redirecting back to localhost. This form only renders on localhost/127.0.0.1, accepts only full github.com/settings/installations/<digits> URLs, and is intentionally not a production recovery path.

Verification:
- pnpm test tests/settings-management.test.mjs: PASS 9/9.
- pnpm test tests/github-wiring.test.mjs: PASS 8/8.
- pnpm test: PASS 77/77.
- pnpm exec tsc --noEmit: PASS.
- pnpm lint: PASS with 4 existing generated Convex warnings.
- pnpm exec convex dev --once --typecheck enable: PASS with existing Convex AI-files stale notice.

Notes:
- The task is marked Done after user confirmation on 2026-06-22.
- Production still depends on the GitHub App setup/update redirect returning installation_id to Dispatch; full server-side installation ownership verification via GitHub user token remains a separate security design if that scope is approved later.
<!-- SECTION:FINAL_SUMMARY:END -->
