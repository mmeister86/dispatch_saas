import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function pathExists(path) {
  try {
    await access(new URL(`../${path}`, import.meta.url), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

test("X postDraft derives identity server-side and never accepts client user ids", async () => {
  const source = await read("convex/x.ts");
  const postDraftSource = source.slice(
    source.indexOf("export const postDraft"),
    source.indexOf("export const completeOAuthCallback"),
  );
  const postDraftArgsSource = postDraftSource.slice(
    postDraftSource.indexOf("args:"),
    postDraftSource.indexOf("handler:"),
  );

  assert.match(source, /export const postDraft = action\(\{/);
  assert.match(postDraftSource, /draftId:\s*v\.id\("drafts"\)/);
  assert.match(postDraftSource, /text:\s*v\.string\(\)/);
  assert.match(postDraftSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(postDraftSource, /identity\.tokenIdentifier/);
  assert.doesNotMatch(postDraftArgsSource, /userId:\s*v\./);
  assert.doesNotMatch(postDraftSource, /xAccessToken|xRefreshToken/);
});

test("X postDraft validates ownership, subscription, draft status, and connected tokens", async () => {
  const source = await read("convex/x.ts");

  assert.match(source, /export const getDraftForPosting = internalQuery\(\{/);
  assert.match(source, /withIndex\("by_clerkTokenIdentifier"/);
  assert.match(source, /hasActiveSubscriptionForUser/);
  assert.match(source, /ctx\.db\.get\(args\.draftId\)/);
  assert.match(source, /draft\.userId !== user\._id/);
  assert.match(source, /draft\.status !== "draft"/);
  assert.match(source, /draft\.status === "posted"/);
  assert.match(source, /xAccessToken/);
  assert.match(source, /xRefreshToken/);
  assert.match(source, /Connect X before posting/);
  assert.match(source, /Post text cannot be empty/);
});

test("X postDraft refreshes expired tokens, posts text, and stores the X post id after success", async () => {
  const source = await read("convex/x.ts");
  const xApiSource = await read("convex/xApi.ts");
  const postDraftSource = source.slice(
    source.indexOf("export const postDraft"),
    source.indexOf("export const getDraftForPosting"),
  );

  assert.match(postDraftSource, /tokenExpiresAt <= Date\.now\(\)/);
  assert.match(postDraftSource, /ctx\.runAction\(internal\.x\.refreshUserToken/);
  assert.match(postDraftSource, /ctx\.runQuery\(\s*internal\.x\.getDraftForPosting/);
  assert.match(postDraftSource, /ctx\.runMutation\(internal\.x\.claimDraftPosting/);
  assert.match(postDraftSource, /createXPost\(\{/);
  assert.match(postDraftSource, /accessToken:\s*refreshedContext\.accessToken/);
  assert.match(postDraftSource, /text:\s*trimmedText/);
  assert.match(postDraftSource, /mediaId:\s*claimedDraft\.mediaId/);
  assert.match(postDraftSource, /recoverPostedDraftRecord/);
  assert.match(source, /export const markDraftPosted = internalMutation\(\{/);
  assert.match(source, /export const recoverPostedDraftRecord = internalMutation\(\{/);
  assert.match(source, /chosenText:\s*args\.chosenText/);
  assert.match(source, /status:\s*"posted"/);
  assert.match(source, /xPostId:\s*args\.xPostId/);
  assert.match(source, /postedAt:\s*args\.postedAt/);
  assert.match(xApiSource, /const X_CREATE_POST_URL = "https:\/\/api\.x\.com\/2\/tweets"/);
  assert.match(xApiSource, /method:\s*"POST"/);
  assert.match(xApiSource, /Authorization:\s*`Bearer \$\{accessToken\}`/);
  assert.match(xApiSource, /JSON\.stringify\(body\)/);
  assert.doesNotMatch(xApiSource, /await response\.text\(\)/);
});

test("X postDraft reserves monthly post quota before calling X", async () => {
  const source = await read("convex/x.ts");
  const postDraftSource = source.slice(
    source.indexOf("export const postDraft"),
    source.indexOf("export const completeOAuthCallback"),
  );
  const claimDraftPostingSource = source.slice(
    source.indexOf("export const claimDraftPosting"),
    source.indexOf("export const clearDraftPosting"),
  );

  assert.match(source, /from "\.\/planLimits"/);
  assert.ok(
    postDraftSource.indexOf("claimDraftPosting") <
      postDraftSource.indexOf("createXPost"),
  );
  assert.match(claimDraftPostingSource, /getActiveSubscriptionForPosting/);
  assert.match(claimDraftPostingSource, /postLimitForPlan\(subscription\.plan\)/);
  assert.match(claimDraftPostingSource, /effectivePostsThisPeriodForSubscription\(ctx,\s*subscription\)/);
  assert.match(claimDraftPostingSource, /effectivePostsThisPeriod >= postLimit/);
  assert.match(claimDraftPostingSource, /Upgrade to Better to keep posting this period/);
  assert.match(claimDraftPostingSource, /postsThisPeriod:\s*effectivePostsThisPeriod \+ 1/);
  assert.match(claimDraftPostingSource, /subscriptionId:\s*subscription\._id/);
  assert.match(claimDraftPostingSource, /subscriptionPeriodEnd:\s*subscription\.currentPeriodEnd/);
});

test("failed X post releases the monthly post quota reservation", async () => {
  const source = await read("convex/x.ts");
  const postDraftSource = source.slice(
    source.indexOf("export const postDraft"),
    source.indexOf("export const completeOAuthCallback"),
  );
  const clearDraftPostingSource = source.slice(
    source.indexOf("export const clearDraftPosting"),
    source.indexOf("export const markDraftPosted"),
  );

  assert.match(postDraftSource, /subscriptionId:\s*claimedDraft\.subscriptionId/);
  assert.match(postDraftSource, /subscriptionPeriodEnd:\s*claimedDraft\.subscriptionPeriodEnd/);
  assert.match(clearDraftPostingSource, /subscriptionId:\s*v\.id\("subscriptions"\)/);
  assert.match(clearDraftPostingSource, /subscriptionPeriodEnd:\s*v\.number\(\)/);
  assert.match(clearDraftPostingSource, /ctx\.db\.get\(args\.subscriptionId\)/);
  assert.match(clearDraftPostingSource, /if \(!draft\.postingStartedAt\) \{\s*return null;\s*\}/s);
  assert.match(clearDraftPostingSource, /subscription\.currentPeriodEnd === args\.subscriptionPeriodEnd/);
  assert.match(clearDraftPostingSource, /Math\.max\(0,\s*subscription\.postsThisPeriod - 1\)/);
  assert.doesNotMatch(source.slice(
    source.indexOf("export const markDraftPosted"),
    source.indexOf("export const recoverPostedDraftRecord"),
  ), /postsThisPeriod:\s*.*\+/);
});

test("drafts query exposes a bounded review list without leaking X tokens", async () => {
  assert.equal(await pathExists("convex/drafts.ts"), true);

  const source = await read("convex/drafts.ts");

  assert.match(source, /export const listForReview = query\(\{/);
  assert.match(source, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(source, /identity\.tokenIdentifier/);
  assert.match(source, /withIndex\("by_userId"/);
  assert.match(source, /\.order\("desc"\)/);
  assert.match(source, /\.take\(20\)/);
  assert.match(source, /repoFullName/);
  assert.match(source, /xPostId/);
  assert.match(source, /mediaId/);
  assert.doesNotMatch(source, /xAccessToken|xRefreshToken/);
});

test("subscriber workspace exposes a minimal draft review and post flow", async () => {
  const source = await read("components/drafts-workspace.tsx");

  assert.match(source, /api\.drafts\.listForReview/);
  assert.match(source, /api\.x\.postDraft/);
  assert.match(source, /DraftsWorkspace/);
  assert.match(source, /Post to X/);
  assert.match(source, /textarea/);
  assert.match(source, /postingDraftId/);
  assert.match(source, /Choose a variant/);
});
