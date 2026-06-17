# PRD.md — Dispatch

> Working title: **Dispatch**. (Separate product from Matthias' personal `dispatch` CLI. Before launch: confirm X handle + domain availability; rename if collision hurts positioning. Not a build blocker.)

---

## 1. One-liner (≤10 words)
**Turn every commit into a build-in-public tweet you'll actually post.**

---

## 2. The one user & the one painpoint

**Who:** Solo founders / indie hackers who *want* to build in public on X, but freeze at every commit because they don't know what to write.

**The painpoint:** "I never know what to post" → so they post nothing. Consistency dies not from laziness but from the blank-page tax on every single update.

**Evidence the pain is real:**
- The build-in-public crowd complains about exactly this on X, in Indie Hackers threads, r/SaaS, and BIP Discords: "I keep forgetting / don't know what's worth posting / my updates sound like a boring changelog."
- **What they do instead today:** (a) nothing — they ship silently; (b) sporadic, guilt-driven bursts; (c) manually paste a diff or changelog into ChatGPT, rewrite it, copy it back into X. Option (c) is the real competitor — slow, off-brand, and abandoned within a week.

---

## 3. Core action / happy path

The entire product is this one flow:

1. User pays (hard paywall) and connects their **GitHub repo** and their **X account**.
2. User pushes a commit. Dispatch receives the push via webhook.
3. Dispatch reads the commit and **generates 2–3 build-in-public tweet variants** — written in a real BIP voice, not a changelog.
4. The draft lands in the user's **Drafts inbox**. User opens it, sees the variants.
5. User picks one, optionally tweaks a word, hits **Post**.
6. The tweet is published to X via the API. Done — in ~20 seconds, with zero blank-page agony.

**The one lovable moment:** Step 3→4 — the instant the user sees the first generated tweet from their *own real commit* and it reads like something they'd genuinely post (a small story or learning, a hook, their voice) instead of "chore: bump deps."

**What makes it land:**
- **Speed** — variants are ready by the time they open the inbox.
- **Smart default** — Dispatch reframes a dull commit into an interesting angle automatically; the user never starts from blank.
- **Small delight** — 2–3 distinct angles (the "what I shipped", the "what I learned", the "behind the scenes") so picking a voice feels like choosing, not writing.

---

## 4. In scope for v1 (each passes the Justification Test)

1. **Connect one GitHub repo + receive push events.** No commits in → nothing to generate. Core fails without it.
2. **Generate 2–3 high-quality, on-brand BIP tweet variants from a commit.** This *is* the value and the lovable moment. Core fails without it.
3. **Review + edit + 1-click post to X via API.** The output must reach X in one click; that's the action. Fails without it.
4. **Connect X account via OAuth to post on the user's behalf.** Can't post without it.
5. **Hard paywall (Lemon Squeezy) + monthly post cap per tier.** No paywall = no business; without the cap an active €9 user costs more in X API fees than they pay → unit economics fail. Viability fails without it.
6. **Optional image attachment on the review screen (X Media Upload API).** BIP tweets with code screenshots or UI previews significantly outperform text-only on X; this is the difference between a tweet that gets ignored and one that performs. Scope: user uploads one image file in the review screen → posted alongside the tweet text. No auto-generation of screenshots from diffs — that stays on the parking lot.

---

## 5. Explicitly OUT of scope (parking lot — longer than in-scope, on purpose)

- Full autonomous posting (commit → tweet with no review)
- **Scheduling / posting queue** (the one Matthias was tempted by — stays parked)
- Multi-platform (LinkedIn, Bluesky, Mastodon, Threads)
- Triggers other than commits (PRs, releases, merged issues, deploys)
- User-facing analytics dashboard (impressions, engagement)
- Thread generation (multi-tweet)
- Auto-generated code screenshot / diff-to-image rendering (manual upload is in scope; auto-generation is not)
- Multiple X accounts per user
- Tone/voice customization UI (v1 uses one strong default voice)
- Team / multi-seat
- Draft history, search, archive
- "Best" / Enterprise tier
- Any integration beyond GitHub + X

---

## 6. Definition of Shipped (binary)

- Deployed on Vercel (via `staging` branch).
- Core action works end-to-end: pay → connect GitHub + X → push commit → generated variants appear → 1-click post lands on X.
- The lovable moment survives review (variants are genuinely post-worthy, not changelog noise).
- Payment is taken via **Lemon Squeezy** as a **subscription, hard paywall, no free plan**.
- Landing page live with clickable demo + pricing.
- **Impressum + Datenschutzerklärung live** (DE sole-proprietor requirement — launch-blocking, not optional).
- **Rybbit analytics tracking the success metric** (landing visit → demo interaction → signup → paid conversion, at minimum).
- Public build-in-public launch post published.

**Success metric:** **5 paying users in 30 days.** See §13 for what happens on hit vs. miss.

---

## 7. Data model (minimal Convex tables)

> Auth/session tables are managed by Clerk; Convex reads identity via `ctx.auth.getUserIdentity()` — no separate session table needed. App tables below — every one is touched by the core action.

- **users** — `id`, `email`, `githubId`, `xUserId`, `xAccessToken` (encrypted), `xRefreshToken` (encrypted), `xConnectedAt`, `createdAt`
- **subscriptions** — `userId`, `lemonCustomerId`, `lemonSubscriptionId`, `plan` (`good` | `better`), `status` (`active` | `past_due` | `canceled`), `currentPeriodEnd`, `postsThisPeriod`
- **repos** — `userId`, `githubRepoId`, `fullName`, `webhookId`, `connectedAt`
- **drafts** — `userId`, `repoId`, `commitSha`, `commitMessage`, `variants` (string[]), `chosenText` (optional), `mediaId` (optional — X media_id_string after upload), `status` (`draft` | `posted` | `discarded`), `xPostId` (optional), `postedAt` (optional), `createdAt`

No separate `posts` table — a posted tweet is a `draft` with `status: posted` + `xPostId`.

---

## 8. Screens (max 5, one idea each)

| # | Screen | One idea | Primary action |
|---|--------|----------|----------------|
| 1 | **Paywall / Checkout** | Pay before you connect anything | Subscribe (Lemon Squeezy) |
| 2 | **Connect** | Hook up GitHub + X | Connect GitHub → Connect X |
| 3 | **Drafts inbox** | Your commits, already written as tweets | Open a draft |
| 4 | **Draft review** | Pick the best version, optionally attach an image, and ship it | Post to X |
| 5 | **Settings** | Manage repo + subscription | Connect/disconnect repo |

Order enforces the hard paywall: pay (1) → connect (2) → use (3,4). Lovable moment lives in (4).

---

## 9. Landing page spec

**Palette (three colors):** black text · white background · one accent (e.g. X-blue or a single bold color) for the CTA only.

- **Hero** — one idea, fifth-grader headline:
  - Headline (outcome + number): *"Ship a build-in-public tweet for every commit — in 20 seconds, not 20 minutes."*
  - Subhead: *"You push code. Dispatch writes the tweet in your voice. You hit post."*
  - **Interactive demo** (see below).
  - **One CTA:** "Start posting your commits" → checkout.
- **Empathy / problem block** — name the pain better than they can: the blank-page tax on every commit, the silent shipping, the abandoned BIP streak.
- **How it works (3 steps)** — Connect repo → Push a commit → Post the draft.
- **Pricing block** — in the header + a dedicated section. Two tiers (Good/Better, §10). Subscription. Not the cheapest.
- **Comparison table** — vs. the real alternative ("ChatGPT + copy-paste"): see below.
- **Testimonial slots** — 3–5, filled from beta users before launch.
- **Shareable footer** — built-in-public by @matthias_builds, link to the build log / changelog, plus **Impressum + Datenschutzerklärung links** (DE legal requirement).

**The demo (clickable + cheap — no per-visitor LLM/backend):**
A small client-side widget with 3–4 *canned* real commit→tweet pairs. Visitor clicks a sample commit message; the matching pre-generated tweet animates in. Pure static data, no auth, no API call. "Play before you pay." If a live feel is wanted, a 20-second recorded screen capture of the real flow sits beside it — never a live LLM call per visitor.

**Comparison table:**

| | ChatGPT + copy-paste | **Dispatch** |
|---|---|---|
| Pulls your commits automatically | ❌ | ✅ |
| Knows your build context | ❌ | ✅ |
| Build-in-public voice by default | ❌ | ✅ |
| One-click post to X | ❌ | ✅ |
| Time per tweet | ~10 min | ~20 sec |
| Survives past week 1 | rarely | ✅ |

---

## 10. Pricing

**Override note:** Brief preferred one-time pricing. We use a **subscription** instead — justified in one line: the X API bills *per post* on an ongoing basis ($0.015/text, $0.20/post-with-link) plus recurring LLM generation cost, so the cost is recurring per user and a one-time price would go underwater. Subscription is the only model that survives the unit economics. (Same reason Marc Lou's DataFast runs a subscription.)

| Tier | Price | Repos | Published tweets / mo | Drafts generated / mo |
|------|-------|-------|----------------------|----------------------|
| **Good** | **€9/mo** | 1 | up to **20** | up to 100 |
| **Better** | **€19/mo** | up to 5 | up to **60** | up to 300 |

- Posting cap is the cost lever (link-posts at $0.20 dominate); generation is cheap so it's generous.
- Pricing visible in the header. No free plan. Not the cheapest.
- Founding-member angle for launch (see §12) without discounting the list price into the floor.

---

## 11. Plan (90h budget — hours, not calendar days)

- **Sessions 1–3 (~9h):** Lock scope + positioning + landing copy on paper. Repo, stack, `agents.md`, `backlog.md`, Convex + Clerk skeleton, new free Resend Team + domain, staging deploy wired.
- **Sessions 4–18 (~45h):** Core action end-to-end — paywall, GitHub webhook, generation engine, X OAuth + post, post cap, inbox + review. Test-driven, parallel subagents on independent tasks. Nothing else.
- **⛔ FEATURE FREEZE at ~60h (~session 20).** From here: bugs, landing, proof, legal, launch only.
- **Sessions 19–24 (~18h):** Landing & polish — hero/demo/pricing/comparison/testimonials via shadcnblocks; polish the review flow until the lovable moment lands.
- **Sessions 25–28 (~12h):** Proof, legal & analytics — 3–5 beta testimonials, Rybbit wired (funnel + success metric), Impressum + Datenschutz pages added, launch-blockers only.
- **Sessions 29–30 (~6h):** Launch — `git push origin main:staging`, BIP launch post, payments on, watch the metric in Rybbit against the kill criteria, make the pre-decided call on the review date.

---

## 12. Launch & build-in-public plan

- **Where:** @matthias_builds (primary), build-in-public hashtag/community on X, Launch Llama, Indie Hackers, r/SaaS.
- **Founder-led moat:** dogfood it — use Dispatch to post about *building Dispatch*. Every dev commit becomes a launch teaser. The build log is the marketing.
- **The offer:** founding-member spots at the €9/€19 list price with a "lifetime founding price" lock (creates urgency without discounting into the floor).
- **One CTA everywhere:** "Start posting your commits."
- **Proof to collect first (before public launch):** 3–5 testimonials from beta users in the BIP crowd — give them free access for a week in exchange for an honest quote + a screenshot of a tweet Dispatch wrote for them.

---

## 13. Kill criteria & decision

**Success metric:** 5 paying users, measured in **Rybbit**, fixed review date **30 days after launch** (or 90h logged, whichever comes first). The date and the action are decided now — no quiet "I'll give it another month" later.

- **Hit (≥5 paying users):** iterate one cycle on the weakest funnel step Rybbit shows (landing visit → demo interaction → signup → paid conversion) — fix that one step, don't add new features.
- **Missed (<5 paying users):** stop. Write a short post-mortem. Reuse the parts:
  - The **commit → tweet generation engine** (the persona-prompted variant generator) is the reusable asset — repackage as a CLI feature, an open-source library, or a different wrapper.
  - Keep the GitHub-webhook + Convex skeleton as a starter for the next idea.
  - Move on.
