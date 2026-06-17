# backlog.md — Dispatch

Single source of truth for task status. No task → no work. Reference the task id in commits.
Status: `todo` · `doing` · `review` · `done`. Each task is the smallest viable unit with a one-line acceptance check.

Phase budget: 90h / 30 sessions × 3h. **⛔ Feature freeze at ~60h logged (~session 20).**

---

## Phase 1 — Lock & set up (Sessions 1–3, ~9h)

- [ ] **T-001** Scaffold Next.js (App Router) + pnpm — *Accept: `pnpm dev` serves a page locally.*
- [ ] **T-002** Commit `agents.md`, `backlog.md`, `PRD.md`, README — *Accept: all four present at repo root; agents reference agents.md.*
- [ ] **T-003** Init + connect Convex (cloud) — *Accept: `pnpm dlx convex dev` syncs; empty schema deploys.*
- [ ] **T-004** Clerk skeleton with GitHub provider + `ConvexProviderWithClerk` wiring — *Accept: user signs in with GitHub via Clerk; `ctx.auth.getUserIdentity()` resolves in a Convex function; session persists across reload.*
- [ ] **T-005** Wire `staging` branch + Vercel — *Accept: `git push origin main:staging` deploys a hello page.*
- [ ] **T-005a** New free Resend Team + domain for this project, install `@convex-dev/resend` — *Accept: a dedicated Resend Team (not reused from another project) is created, domain verified, component installed, and a test email sends via the component's workpool.*
- [ ] **T-006** Positioning + landing copy on paper — *Accept: hero headline, subhead, 3-step, pricing, comparison drafted in a doc; zero code.*

---

## Phase 2 — Core action (Sessions 4–18, ~45h) — TDD, parallel subagents

- [ ] **T-010** Convex schema: `users`, `subscriptions`, `repos`, `drafts` — *Accept: schema typechecks + deploys; tables visible in Convex dashboard.*
- [ ] **T-011** Lemon Squeezy checkout + webhook → `subscriptions` row — *Accept: completing a test checkout creates an `active` subscription in Convex.*
- [ ] **T-012** Hard paywall guard — *Accept: non-subscriber is redirected to checkout; subscriber reaches the app.*
- [ ] **T-013** Connect GitHub repo + register push webhook — *Accept: selecting a repo stores it and registers a push webhook on GitHub.*
- [ ] **T-014** GitHub push webhook handler → `draft` stub — *Accept: a push event creates a `draft` row with commit sha + message.*
- [ ] **T-015** Generation engine: commit → 2–3 BIP variants (Twitter/X Engager prompt) — *Accept: given a commit message, returns 2–3 on-brand variants; passes fixture tests; no changelog-speak.*
- [ ] **T-016** Wire generation to webhook → drafts populated — *Accept: a push produces a draft with variants within a few seconds.*
- [ ] **T-017** Connect X account (OAuth) + store tokens securely — *Accept: user authorizes X; tokens stored server-side; refresh works.*
- [ ] **T-018** Post to X via API (1-click) + record `xPostId` — *Accept: clicking Post publishes the chosen text; `draft.status=posted` + `xPostId` stored.*
- [ ] **T-018a** X Media Upload — optional image attachment in review screen — *Accept: user can upload one image in the review screen; it is uploaded via X Media Upload API and attached to the post; text-only remains the default and still works without an image.*
- [ ] **T-019** Monthly post counter + per-tier cap — *Accept: posting increments `postsThisPeriod`; over-cap is blocked with an upgrade prompt.*
- [ ] **T-019a** Rate-limit generation + post mutation via `@convex-dev/rate-limiter` — *Accept: rapid repeated triggers (webhook replay, double-click post) are throttled per-user without breaking normal single-commit/single-post usage; sits alongside the monthly cap, doesn't replace it.*
- [ ] **T-020** Drafts inbox screen — *Accept: lists drafts newest-first; clicking one opens detail.*
- [ ] **T-021** Draft review screen (variants, edit, optional image upload, post) — **lovable moment** — *Accept: user sees variants, edits text, optionally attaches an image, posts; Evidence Collector confirms the variants are post-worthy.*
- [ ] **T-022** Settings: manage repo + subscription — *Accept: connect/disconnect repo; link to Lemon Squeezy billing portal.*
- [ ] **T-023** Error/empty states on core path — *Accept: no repo / no commits / expired X token / over-cap / API failure all handled gracefully.*

**⛔ FEATURE FREEZE here (~60h). Below: bugs, landing, proof, launch only.**

---

## Phase 3 — Landing & polish (Sessions 19–24, ~18h) — shadcnblocks

- [ ] **T-030** Hero via shadcnblocks — *Accept: hero block installed; headline + subhead + single CTA live.*
- [ ] **T-031** Clickable canned demo (commit→tweet, client-side) — *Accept: visitor clicks sample commits, sees generated tweet; zero backend/LLM call.*
- [ ] **T-032** Empathy/problem block + how-it-works (3 steps) — *Accept: both sections live via blocks.*
- [ ] **T-033** Pricing block (Good €9 / Better €19, in header) — *Accept: two tiers, prices visible in header, CTA to checkout.*
- [ ] **T-034** Comparison table vs "ChatGPT + copy-paste" — *Accept: table block live with the rows from PRD §9.*
- [ ] **T-035** Testimonial slots — *Accept: 3–5 placeholder slots ready to fill.*
- [ ] **T-036** Shareable footer + OG/meta — *Accept: footer + correct social preview card.*
- [ ] **T-037** Polish core flow until the lovable moment lands — *Accept: review screen feels fast/delightful; signed off by Reality Checker.*

---

## Phase 4 — Proof, legal & analytics (Sessions 25–28, ~12h)

- [ ] **T-040** Collect 3–5 beta testimonials — *Accept: real quotes + a Dispatch-written tweet screenshot in the landing block.*
- [ ] **T-041** Wire Rybbit funnel tracking — *Accept: landing visit → demo interaction → signup → paid conversion are each tracked as distinct events in Rybbit.*
- [ ] **T-041a** Impressum page — *Accept: static `/impressum` route live with Matthias' legally required sole-proprietor details, linked in the footer.*
- [ ] **T-041b** Datenschutzerklärung page — *Accept: static `/datenschutz` route live covering Rybbit, Clerk, Lemon Squeezy, Resend, and X/GitHub data flows; linked in the footer.*
- [ ] **T-042** Fix launch-blockers only — *Accept: known-blocker list is empty.*

---

## Phase 5 — Launch (Sessions 29–30, ~6h)

- [ ] **T-050** Final deploy `git push origin main:staging` — *Accept: production green, payments live.*
- [ ] **T-051** Build-in-public launch post (@matthias_builds + Launch Llama) — *Accept: post published with the single CTA.*
- [ ] **T-052** Watch metric in Rybbit vs. kill criteria — *Accept: on the fixed review date (day 30 / 90h, whichever first), paying-user count is read from Rybbit and the pre-decided action is taken — iterate on weakest funnel step if ≥5, stop + post-mortem if <5.*
