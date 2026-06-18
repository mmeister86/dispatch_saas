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

  assert.match(source, /export const createCheckout = action\(\{/);
  assert.match(source, /plan:\s*v\.union\(\s*v\.literal\("good"\),\s*v\.literal\("better"\)/s);
  assert.match(source, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(source, /identity\.tokenIdentifier/);
  assert.match(source, /by_clerkTokenIdentifier/);
  assert.doesNotMatch(source, /userId:\s*v\./);
  assert.match(source, /https:\/\/api\.lemonsqueezy\.com\/v1\/checkouts/);
  assert.match(source, /Authorization:\s*`Bearer \$\{env\.LEMONSQUEEZY_API_KEY\}`/);
  assert.match(source, /checkout_data/);
  assert.match(source, /custom:\s*\{[^}]*userId[^}]*plan/s);
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
  assert.match(source, /postsThisPeriod:\s*existing\.postsThisPeriod/);
});

test("home page exposes signed-in Good and Better checkout buttons", async () => {
  const source = await read("app/page.tsx");

  assert.match(source, /useAction\(api\.billing\.createCheckout\)/);
  assert.match(source, /handleCheckout\("good"\)/);
  assert.match(source, /handleCheckout\("better"\)/);
  assert.match(source, /window\.location\.assign\(checkout\.url\)/);
});
