---
id: TASK-40
title: Document Vercel branch strategy
status: In Progress
assignee:
  - Codex
created_date: '2026-06-17 12:27'
updated_date: '2026-06-17 12:39'
labels:
  - infra
  - vercel
dependencies: []
priority: medium
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Document the revised Vercel branch strategy: `main` is the Production branch and `staging` is used for development/preview validation. This supersedes the earlier attempt to make `staging` the Production branch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 PRD states that Vercel Production deploys from `main`.
- [x] #2 PRD no longer instructs launch via `git push origin main:staging`.
- [x] #3 Agent instruction files no longer claim that `staging` is the only Vercel-deployed branch.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Locate the PRD and existing branch/deploy wording.
2. Update the PRD so `main` is Production and `staging` is development/preview.
3. Align agent instruction files that contained the previous contradictory branch rule.
4. Search the updated docs for stale `main:staging` launch wording and record verification.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Checked current Vercel CLI 54.14.0 with Context7/current OpenAPI docs. The linked project is `dispatch` (`prj_621YaE98zaEnOf2S6KPnxOdLXrYU`) in team `team_MRttxiYKqmN6yeWxiIpQBvhQ`. Authenticated `vercel api '/v9/projects/dispatch?teamId=team_MRttxiYKqmN6yeWxiIpQBvhQ' --raw` shows `link.productionBranch` is currently `main`; latest `main` deployments are Production and `staging` is Preview. Attempted `PATCH /v9/projects/dispatch` via `vercel api` with `productionBranch=staging`, but Vercel returned 400: `should NOT have additional property productionBranch`. The local OpenAPI schema for `PATCH /v9/projects/{idOrName}` does not expose a production branch write field. No project setting was changed.

User provided Vercel dashboard error: `staging` cannot become Production Branch because it is used for Preview Environment Variables. Confirmed with `vercel env list preview staging --format json` that six sensitive Preview variables are scoped to `gitBranch: staging`: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`. `vercel env list preview main --format json` returns no branch-specific Preview variables for `main`. Context7 docs confirm branch-specific env vars apply only to preview branches, and a production branch cannot also be used as a preview env branch. `vercel env update` does not expose a branch-move operation; the practical CLI fix is delete the `preview staging` variables, or migrate values to `preview main` with explicit secret handling and then delete the `preview staging` variables.

User changed the desired branch strategy: `main` is for production and `staging` is for development/preview. Updated `.docs/PRD.md` accordingly and also aligned `AGENTS.md` and `CLAUDE.md` to avoid future agents following the old `main:staging` deployment rule.
<!-- SECTION:NOTES:END -->
