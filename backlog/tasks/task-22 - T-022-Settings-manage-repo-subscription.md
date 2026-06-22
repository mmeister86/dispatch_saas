---
id: TASK-22
title: 'T-022: Settings: manage repo + subscription'
status: In Progress
assignee:
  - '@Codex'
created_date: '2026-06-17 07:32'
updated_date: '2026-06-22 11:34'
labels:
  - imported-from-docs
  - phase-2
  - t-022
dependencies: []
references:
  - .docs/backlog.md
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
- [ ] #1 connect/disconnect repo; link to Lemon Squeezy billing portal.
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
<!-- SECTION:NOTES:END -->
