# agents.md — Dispatch

Rulebook for coding agents. Two frameworks are installed and **both must be used**:

- **obra/superpowers** (github.com/obra/superpowers) — the development methodology; its skills auto-trigger.
- **msitarzewski/agency-agents** (github.com/msitarzewski/agency-agents) — specialist personas in `~/.claude/agents/`.

Scope discipline lives in `PRD.md`. This file governs *how* the in-scope work gets built. When in doubt, build less.

---

## Methodology — superpowers (mandatory)

- **All coding is test-driven and subagent-driven.** Follow **RED → GREEN → REFACTOR**: write the failing test first, watch it fail, write the minimal code to pass, refactor, commit. **Code written before its test gets deleted. No exceptions.**
- Run every change through the superpowers flow: `brainstorming → writing-plans → feature-branch per task → subagent-driven-development → test-driven-development → requesting-code-review → finishing-a-development-branch` (merge to `main`, never directly to `staging`).
- Use **dispatching-parallel-agents** for independent tasks — each agent gets its own feature branch (e.g. `feat/convex-schema`, `feat/github-webhook`, `feat/generation-engine`, `feat/x-oauth`, `feat/hero-screen`), then branches are reviewed and merged to `main` sequentially. Default to parallel whenever tasks don't share files.
- Hold the line on **YAGNI, DRY, complexity reduction, and evidence over claims** — verify it works, don't assert it.

---

## Specialists — agency-agents (one persona per task, minimal roster)

Use a specialist, not a generic agent. Only pull in what the current task needs.

- **Scope / validation:** Trend Researcher, Product Manager, Sprint Prioritizer.
- **Build:**
  - Rapid Prototyper — spikes (e.g. the canned landing demo).
  - Backend Architect — Convex schema + functions, GitHub push webhook, X API posting, Lemon Squeezy webhook, post-cap enforcement.
  - Frontend Developer — Next.js + shadcn drafts inbox + review screen.
  - Minimal Change Engineer — small diffs.
  - **Twitter/X Engager** — owns the **commit → tweet generation prompt** (the product's lovable moment). This persona's instincts *are* the production system prompt: hook, BIP voice, 2–3 distinct angles, no changelog-speak. Treat its output quality as a launch gate.
- **Quality gate:** Code Reviewer, Reality Checker (production-readiness), Evidence Collector (visual proof the core action + lovable moment work).
- **Launch:** UI Designer (landing), Pricing Analyst, Growth Hacker, Twitter/X Engager (launch copy), SEO Specialist, Email Marketing Strategist.

---

## Workflow & tasks

- Every change starts as a task in **`backlog.md`**. **No task → no work.** superpowers' plans expand a task into steps; `backlog.md` stays the single source of truth for status.
- Tasks are small, outcome-named, and traceable. **Reference the task id in commits** (e.g. `T-015: generation engine returns 3 variants`).
- A task is **done** only when its tests are green and the acceptance check passes.

---

## Code philosophy

- Write the **least code that ships the task.** Deleting beats adding.
- Modular and colocated; no premature abstraction, no speculative generality.
- Prefer framework/library defaults over custom solutions.
- No dead code, no unused deps, no "we might need this later."

---

## Stack conventions

- **Package manager: always `pnpm`** (`pnpm dlx` not `npx`, `pnpm add` not `npm install`). Never npm/yarn — keeps the lockfile consistent and reduces supply-chain surface.
- **Next.js (latest, App Router).** Server Components by default; client only when needed.
- **Convex (cloud)** for ALL data and backend logic — GitHub webhook handler, generation, X posting, Lemon Squeezy webhook, post-cap counter. No separate API layer.
- **Clerk** (auth, GitHub provider) via `ConvexProviderWithClerk` — JWT-based, no webhook sync needed for auth state: Convex validates Clerk's token directly via `ctx.auth.getUserIdentity()`. Free Hobby tier (unlimited apps, 50k MRU) covers this project and includes bot protection, account lockout, and disposable-email blocking out of the box — don't rebuild these. Set up `auth.config.ts` with `CLERK_JWT_ISSUER_DOMAIN`, wrap the app in `<ClerkProvider>` → `<ConvexProviderWithClerk>`.
- **Resend** (transactional email) via the **official `@convex-dev/resend` component** — built with the Resend team; handles queuing, batching, idempotency, and retries via Convex workpools (durable execution), so emails aren't lost on transient failures. **New project → new free Resend Team** (Team switcher, one login): each Team gets its own domain and its own free 3,000/mo, 1-domain quota — don't try to cram multiple projects' domains into one Team. · **Lemon Squeezy** (billing + the hard paywall, EU VAT as merchant of record).
- **`@convex-dev/rate-limiter`** — Clerk covers signup/login abuse; this component covers abuse of the core action itself (generation + posting, the paid/costly paths). Per-user or per-key token-bucket/fixed-window limits, type-safe and transactional. Add it wherever the core action could be hammered — e.g. wrapping the generation engine and the X-post mutation, on top of the monthly post cap (T-019), not instead of it: the rate limiter throttles *bursts*, the post cap enforces the *monthly* unit-economics ceiling.
- **shadcn/ui + Tailwind (latest).** Use shadcn primitives; don't hand-roll what they provide. Stick to the three-color palette (black / white / one accent).
- **shadcnblocks (Pro license)** for marketing/landing sections (hero, pricing, comparison, testimonials, footer): install prebuilt blocks via CLI instead of hand-building —
  `pnpm dlx shadcn@latest add @shadcnblocks/<block>` (e.g. `hero-125`, `pricing3`). The CLI auto-installs missing npm deps + shadcn components.
  Setup: `SHADCNBLOCKS_API_KEY` (`sk_live_…`) in `.env.local`, plus the `@shadcnblocks` namespaced registry in `components.json` (url `https://shadcnblocks.com/r/{name}`, header `Authorization: Bearer ${SHADCNBLOCKS_API_KEY}`). Use **Free / Basic / Pro** blocks only — never Premium-tier.
- **Analytics: Rybbit (self-hosted).** Track the funnel for the core action and the success metric from the kill criteria — at minimum: landing visit → demo interaction → signup → paid conversion. No Google Analytics / Vercel Analytics. Privacy-friendly and cookieless, which also keeps the Datenschutzerklärung simple.
- **Legal pages (DE).** As a German sole proprietor with a paid public app, an **Impressum** and **Datenschutzerklärung** are launch-blocking, not optional. Add two static routes and link them in the footer. Lemon Squeezy acts as Merchant of Record (handles VAT/invoicing), but the Impressum + privacy notice for the site itself are still Matthias' own responsibility.
- **Public demo = cheap and safe.** Front and back share one Next.js repo, but the landing demo stays **client-side on canned/mock data**: no auth, no LLM/agent call per visitor, no heavy Convex job. A public endpoint that runs expensive work per click is a cost/abuse hole — don't ship one. The commit→tweet generation engine is **never** exposed to unauthenticated visitors.
- **Secrets:** X tokens and all keys live server-side / in Convex env. No secrets in client code, ever.

**Branch & deploy strategy:**
- `main` — integration branch, tested locally only, **never directly deployed.**
- `feat/*` — one per task/agent, short-lived, merged to `main` via PR after review.
- `staging` — the **only** Vercel-deployed branch. Never commit to it directly; update it exclusively via `git push origin main:staging` after local testing on `main` confirms green.

No dependency or service beyond this stack without a one-line justification in the task.

---

## Always-current docs

Before using any library API (Convex, Clerk, `@convex-dev/resend`, `@convex-dev/rate-limiter`, Lemon Squeezy, X API, GitHub webhooks, shadcn), pull current docs via **Context7** — versions move fast, don't code from memory. The X API in particular re-priced and moved endpoints in 2026; verify write endpoints and auth before building the post flow.

---

## Guardrails (lovable on the core path, rough at the edges is fine)

- Typed throughout · no secrets in client code.
- The **core action is polished** and handles its obvious error/empty states: no repo connected, no commits yet, X token expired, monthly post cap reached, GitHub/X API failure.
- The **lovable moment (generated variants) must survive Code Review + Evidence Collector** — if the tweets read like a changelog, the task is not done.
- Everything off the core path stays minimal until it blocks launch.

---

## Definition of done (per task)

- Tests green.
- Core action still works end-to-end.
- Typechecks.
- No new unused code / deps.
- Passed Code Reviewer + Reality Checker.
- Task marked done in `backlog.md`.
