import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("package installs and registers the official Convex rate limiter component", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const convexConfigSource = await read("convex/convex.config.ts");
  const apiTypesSource = await read("convex/_generated/api.d.ts");

  assert.equal(
    typeof packageJson.dependencies["@convex-dev/rate-limiter"],
    "string",
  );
  assert.match(
    convexConfigSource,
    /@convex-dev\/rate-limiter\/convex\.config\.js/,
  );
  assert.match(convexConfigSource, /app\.use\(rateLimiter\)/);
  assert.match(apiTypesSource, /rateLimiter:/);
  assert.match(apiTypesSource, /@convex-dev\/rate-limiter/);
});

test("shared rate limits use balanced per-user generation and posting buckets", async () => {
  const source = await read("convex/rateLimits.ts");

  assert.match(source, /new RateLimiter\(components\.rateLimiter/);
  assert.match(source, /generateDraftVariants:\s*\{/);
  assert.match(source, /kind:\s*"token bucket"/);
  assert.match(source, /rate:\s*3/);
  assert.match(source, /period:\s*60_000/);
  assert.match(source, /capacity:\s*3/);
  assert.match(source, /postDraftToX:\s*\{/);
  assert.match(source, /kind:\s*"fixed window"/);
  assert.match(source, /rate:\s*1/);
  assert.match(source, /period:\s*10_000/);
});

test("GitHub push draft generation is reserved per user after draft insertion", async () => {
  const source = await read("convex/http.ts");
  const createDraftSource = source.slice(
    source.indexOf("export const createDraftsFromGithubPushWebhook"),
    source.indexOf("async function isValidSignature"),
  );

  assert.match(source, /import \{ rateLimiter \} from "\.\/rateLimits"/);
  assert.ok(
    createDraftSource.indexOf("existingDraft.length > 0") <
      createDraftSource.indexOf('ctx.db.insert("drafts"'),
  );
  assert.match(
    createDraftSource,
    /rateLimiter\.limit\(\s*ctx,\s*"generateDraftVariants",\s*\{\s*key:\s*repo\.userId,\s*reserve:\s*true,\s*\},\s*\)/s,
  );
  assert.ok(
    createDraftSource.indexOf('ctx.db.insert("drafts"') <
      createDraftSource.indexOf("rateLimiter.limit("),
  );
  assert.doesNotMatch(createDraftSource, /if \(!generationLimit\.ok\) \{\s*continue;\s*\}/s);
  assert.match(createDraftSource, /generationLimit\.retryAfter \?\? 0/);
  assert.ok(
    createDraftSource.indexOf("generationLimit.ok") <
      createDraftSource.indexOf("internal.generation.populateDraftVariants"),
  );
});

test("X posting is rate limited per user before quota reservation and X API calls", async () => {
  const source = await read("convex/x.ts");
  const postDraftSource = source.slice(
    source.indexOf("export const postDraft"),
    source.indexOf("export const completeOAuthCallback"),
  );

  assert.match(source, /import \{ rateLimiter \} from "\.\/rateLimits"/);
  assert.ok(
    postDraftSource.indexOf('postingContext.status === "posted"') <
      postDraftSource.indexOf('rateLimiter.limit(ctx, "postDraftToX"'),
  );
  assert.match(
    postDraftSource,
    /rateLimiter\.limit\(ctx,\s*"postDraftToX",\s*\{\s*key:\s*postingContext\.userId,\s*\}\)/s,
  );
  assert.match(
    postDraftSource,
    /You're posting too quickly\. Try again in a few seconds\./,
  );
  assert.ok(
    postDraftSource.indexOf('rateLimiter.limit(ctx, "postDraftToX"') <
      postDraftSource.indexOf("refreshUserToken"),
  );
  assert.ok(
    postDraftSource.indexOf('rateLimiter.limit(ctx, "postDraftToX"') <
      postDraftSource.indexOf("claimDraftPosting"),
  );
  assert.ok(
    postDraftSource.indexOf('rateLimiter.limit(ctx, "postDraftToX"') <
      postDraftSource.indexOf("createXPost"),
  );
});
