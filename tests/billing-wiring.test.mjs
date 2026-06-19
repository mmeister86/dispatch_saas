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

test("Convex app declares Lemon Squeezy environment variables", async () => {
  const source = await read("convex/convex.config.ts");

  assert.match(source, /defineApp\(\{\s*env:\s*\{/s);
  for (const name of [
    "LEMONSQUEEZY_API_KEY",
    "LEMONSQUEEZY_STORE_ID",
    "LEMONSQUEEZY_GOOD_VARIANT_ID",
    "LEMONSQUEEZY_BETTER_VARIANT_ID",
    "LEMONSQUEEZY_WEBHOOK_SECRET",
    "APP_URL",
  ]) {
    assert.match(source, new RegExp(`${name}:\\s*v\\.string\\(\\)`));
  }
});

test("checkout creation derives the user server-side and embeds Lemon custom data", async () => {
  const source = await read("convex/billing.ts");
  const createCheckoutSource = source.slice(
    source.indexOf("export const createCheckout"),
    source.indexOf("export const hasActiveSubscriptionForUser"),
  );

  assert.match(source, /export const createCheckout = action\(\{/);
  assert.match(source, /plan:\s*v\.union\(\s*v\.literal\("good"\),\s*v\.literal\("better"\)/s);
  assert.match(createCheckoutSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(createCheckoutSource, /identity\.tokenIdentifier/);
  assert.match(source, /by_clerkTokenIdentifier/);
  assert.doesNotMatch(createCheckoutSource, /userId:\s*v\./);
  assert.match(source, /https:\/\/api\.lemonsqueezy\.com\/v1\/checkouts/);
  assert.match(source, /Authorization:\s*`Bearer \$\{env\.LEMONSQUEEZY_API_KEY\}`/);
  assert.match(source, /checkout_data/);
  assert.match(source, /custom:\s*\{[^}]*userId[^}]*plan/s);
  assert.match(source, /internal\.billing\.hasActiveSubscriptionForUser/);
  assert.match(source, /already has an active Dispatch subscription/);
  assert.doesNotMatch(source, /Number\(variantId\)/);
  assert.match(source, /await response\.text\(\)/);
  assert.match(source, /responseBody/);
  assert.match(source, /return\s+\{\s*url:/);
});

test("Lemon Squeezy webhook verifies raw body signature in Convex HTTP", async () => {
  const source = await read("convex/http.ts");

  assert.match(source, /httpRouter\(\)/);
  assert.match(source, /path:\s*"\/lemon-squeezy\/webhook"/);
  assert.match(source, /method:\s*"POST"/);
  assert.match(source, /httpAction\(async \(ctx,\s*req\)/);
  assert.match(source, /req\.text\(\)/);
  assert.match(source, /X-Signature/);
  assert.match(source, /crypto\.subtle\.importKey/);
  assert.match(source, /crypto\.subtle\.sign\(\s*"HMAC"/s);
  assert.match(source, /env\.LEMONSQUEEZY_WEBHOOK_SECRET/);
  assert.match(source, /timingSafeHexEqual/);
  assert.match(source, /JSON\.parse\(rawBody\)/);
  assert.equal(await pathExists("app/api/lemon-squeezy/webhook/route.ts"), false);
});

test("subscription webhook upserts Lemon Squeezy state by subscription id", async () => {
  const source = await read("convex/http.ts");

  assert.match(source, /subscription_created/);
  assert.match(source, /subscription_updated/);
  assert.match(source, /catch\s*\{/);
  assert.match(source, /attributes\.customer_id\s*==\s*null/);
  assert.match(source, /planFromVariantId\(attributes\.variant_id\)/);
  assert.match(source, /env\.LEMONSQUEEZY_GOOD_VARIANT_ID/);
  assert.match(source, /env\.LEMONSQUEEZY_BETTER_VARIANT_ID/);
  assert.match(source, /customPlan !== plan/);
  assert.match(source, /by_lemonSubscriptionId/);
  assert.match(source, /lemonCustomerId:\s*String\(attributes\.customer_id\)/);
  assert.match(source, /lemonSubscriptionId:\s*subscriptionId/);
  assert.match(source, /const status = attributes\s*\?\s*mapSubscriptionStatus\(attributes\.status\)/s);
  assert.match(source, /status,\s*currentPeriodEnd:/s);
  assert.match(source, /parseLemonDate\(periodEndForStatus\(attributes\)\)/);
  assert.match(source, /v\.literal\("active"\)/);
  assert.match(source, /postsThisPeriod:\s*0/);
  assert.match(source, /existing\.postsThisPeriod/);
});

test("subscription webhook resets post usage when the billing period changes", async () => {
  const source = await read("convex/http.ts");
  const upsertSource = source.slice(
    source.indexOf("export const upsertSubscriptionFromWebhook"),
    source.indexOf("export const createDraftFromGithubPushWebhook"),
  );

  assert.match(upsertSource, /const postsThisPeriod =\s*existing\.currentPeriodEnd === args\.currentPeriodEnd\s*\?\s*existing\.postsThisPeriod\s*:\s*0/s);
  assert.match(upsertSource, /postsThisPeriod,\s*\}\);/);
});

test("home page exposes signed-in Good and Better checkout buttons", async () => {
  const source = await read("app/page.tsx");

  assert.match(source, /useAction\(api\.billing\.createCheckout\)/);
  assert.match(source, /handleCheckout\("good"\)/);
  assert.match(source, /handleCheckout\("better"\)/);
  assert.match(source, /window\.location\.assign\(checkout\.url\)/);
});

test("billing exposes a server-derived current access guard", async () => {
  const source = await read("convex/billing.ts");
  const planLimitsSource = await read("convex/planLimits.ts");
  const currentAccessSource = source.slice(
    source.indexOf("export const currentAccess"),
    source.indexOf("export const createCheckout"),
  );

  assert.match(currentAccessSource, /export const currentAccess = query\(\{/);
  assert.match(currentAccessSource, /args:\s*\{\}/);
  assert.doesNotMatch(currentAccessSource, /userId:\s*v\./);
  assert.match(currentAccessSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(currentAccessSource, /identity\.tokenIdentifier/);
  assert.match(source, /by_clerkTokenIdentifier/);
  assert.match(source, /by_userId_and_status_and_currentPeriodEnd/);
  assert.match(currentAccessSource, /getActiveSubscription\(ctx,\s*user\._id\)/);
  assert.match(source, /\.eq\("userId",\s*userId\)/);
  assert.match(source, /\.eq\("status",\s*"active"\)/);
  assert.match(source, /\.gt\("currentPeriodEnd",\s*now\)/);
  assert.match(source, /state:\s*"signedOut"/);
  assert.match(source, /state:\s*"needsSubscription"/);
  assert.match(source, /state:\s*"active"/);
  assert.match(source, /postLimitForPlan\(subscription\.plan\)/);
  assert.match(currentAccessSource, /postLimit:/);
  assert.match(currentAccessSource, /postsRemaining:/);
  assert.match(currentAccessSource, /effectivePostsThisPeriodForSubscription\(ctx,\s*subscription\)/);
  assert.match(planLimitsSource, /status",\s*"posted"/);
  assert.match(planLimitsSource, /monthlyPeriodStartForEnd\(subscription\.currentPeriodEnd\)/);
  assert.match(planLimitsSource, /Math\.max\(subscription\.postsThisPeriod,\s*postedThisPeriod\)/);
});

test("home page gates the app by subscription access", async () => {
  const source = await read("app/page.tsx");

  assert.match(source, /useQuery\(api\.billing\.currentAccess\)/);
  assert.match(source, /PaywallView/);
  assert.match(source, /SubscriberApp/);
  assert.match(source, /Start with Good/);
  assert.match(source, /Start with Better/);
  assert.match(source, /Connected and paid/);
  assert.match(source, /access\.postsThisPeriod\}\/\{access\.postLimit/);
  assert.match(source, /Upgrade to Better to keep posting this period/);
  assert.match(source, /Your Better plan renews on/);
  assert.doesNotMatch(source, /api\.viewer\.current/);
  assert.doesNotMatch(source, /Convex identity/);
});
