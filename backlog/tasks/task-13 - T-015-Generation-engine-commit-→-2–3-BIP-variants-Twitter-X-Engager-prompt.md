---
id: TASK-13
title: 'T-015: Generation engine: commit → 2–3 BIP variants (Twitter/X Engager prompt)'
status: In Progress
assignee:
  - Codex
created_date: '2026-06-17 07:32'
updated_date: '2026-06-18 19:22'
labels:
  - imported-from-docs
  - phase-2
  - t-015
dependencies: []
references:
  - .docs/backlog.md
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Imported from .docs/backlog.md.
Source ID: T-015
Phase: Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 given a commit message, returns 2–3 on-brand variants; passes fixture tests; no changelog-speak.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# TASK-13 / T-015 Generation Engine Plan

## Summary
Build the commit-to-BIP-variant engine as a Convex-only internal action using Vercel AI SDK. The local Twitter Engager agent is used as the source for a curated runtime system prompt and quality review gate, but the app must not read ~/.claude/agents at runtime.

## Key Changes
- Add pure generation helpers for prompt assembly, variant normalization, changelog-speak rejection, and 2-3 variant validation.
- Add a curated TWITTER_ENGAGER_SYSTEM_PROMPT constant distilled from /Users/matthias/.claude/agents/marketing/marketing-twitter-engager.md, .docs/PRD.md, and .docs/T-006-positioning-landing-copy.md.
- Use only relevant Twitter Engager traits: conversational, authentic, value-first, thought-leadership/personal-story framing, hook-first writing, no broadcast/changelog tone, and variants that feel like something an indie builder would actually post.
- Exclude irrelevant agent sections from the runtime prompt: DMs, crisis response, ads, Twitter Spaces, campaign analytics.
- Add convex/generation.ts as an internalAction using Vercel AI SDK structured output with Zod.
- Add env vars OPENAI_API_KEY and AI_MODEL.

## Test Plan
- Add fixture tests for 2-3 variants, distinctness, 280-character max, changelog-speak rejection, Twitter Engager-derived prompt rules, no local agent file reads at runtime, and internalAction registration.
- Verify with pnpm test, pnpm exec tsc --noEmit, and pnpm lint.

## Boundaries
- TASK-13 stops at given a commit message, return variants.
- Writing variants into draft rows remains TASK-14 / T-016.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented TASK-13 generation engine on branch codex/task-13-generation-engine. Added Vercel AI SDK dependencies (`ai`, `@ai-sdk/openai`, `zod`), Convex env typing for `OPENAI_API_KEY` and `AI_MODEL`, pure generation helpers in `convex/generationCore.ts`, and an internal Convex action in `convex/generation.ts` using `generateObject` with a Zod schema. The runtime prompt is curated from the local Twitter Engager persona and Dispatch docs; it does not read local agent files at runtime. Added deterministic commit-message truncation to bound LLM input cost/risk after code review. Verification: `pnpm test` passed 37/37; `pnpm exec tsc --noEmit` exited 0; `pnpm lint` exited 0 with 4 existing warnings in Convex generated files. Twitter Engager review found no Critical/Important issues; Code Reviewer found no blockers and the two actionable Important items were addressed.
<!-- SECTION:NOTES:END -->
