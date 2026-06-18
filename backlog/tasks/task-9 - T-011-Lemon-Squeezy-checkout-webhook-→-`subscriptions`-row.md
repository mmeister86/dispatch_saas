---
id: TASK-9
title: 'T-011: Lemon Squeezy checkout + webhook → `subscriptions` row'
status: In Progress
assignee: []
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 09:37'
labels:
  - imported-from-docs
  - phase-2
  - t-011
dependencies: []
references:
  - .docs/backlog.md
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-011
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 completing a test checkout creates an `active` subscription in Convex.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# TASK-9 / T-011 Implementation Plan

1. Add source-contract tests for billing checkout and Lemon Squeezy webhook wiring. Verify RED with pnpm test before production code.
2. Implement Convex env typing for Lemon Squeezy API key, store ID, Good/Better variant IDs, webhook secret, and APP_URL.
3. Add convex/billing.ts with createCheckout action that derives Clerk identity server-side, ensures a users row, creates a Lemon Squeezy checkout via REST, embeds userId and plan in checkout custom data, and returns only the URL.
4. Add convex/http.ts with POST /lemon-squeezy/webhook that verifies X-Signature using HMAC SHA-256 over the raw body, handles subscription_created/subscription_updated, ignores unrelated events, and idempotently upserts subscriptions by lemonSubscriptionId while preserving postsThisPeriod.
5. Update app/page.tsx with minimal signed-in Good/Better checkout buttons that call api.billing.createCheckout and redirect to the returned URL.
6. Run pnpm test, pnpm exec tsc --noEmit, pnpm lint, and pnpm exec convex dev --once --typecheck enable.
7. Request code review, address issues, then update Backlog notes and acceptance criteria only after verification evidence.

Manual acceptance after env setup: configure Lemon test webhook to https://<convex-deployment>.convex.site/lemon-squeezy/webhook, complete a test checkout, and confirm an active subscriptions row exists for the signed-in user.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented checkout + webhook path with TDD on branch codex/task-9-lemon-squeezy.

Verification:
- pnpm test: PASS, 18/18.
- pnpm exec tsc --noEmit: PASS.
- pnpm lint: PASS with 4 generated-file warnings only.
- pnpm exec convex codegen --typecheck enable: PASS.
- pnpm exec convex dev --once --typecheck enable: reached dev deployment careful-ox-998 but failed because required Convex env vars are not set: APP_URL, LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_BETTER_VARIANT_ID, LEMONSQUEEZY_GOOD_VARIANT_ID, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET.

Code review:
- Initial reviewer flagged trusting custom_data.plan as a billing security issue. Fixed by deriving plan from Lemon attributes.variant_id and rejecting custom plan mismatches.
- Re-review found no remaining blockers.

Acceptance criterion is intentionally unchecked until real Lemon Squeezy test env vars are configured and a test checkout creates an active subscription row in Convex.
<!-- SECTION:NOTES:END -->
