import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Convex schema defines only the core app tables", async () => {
  const source = await read("convex/schema.ts");

  assert.match(source, /defineSchema\(\{/);
  assert.match(source, /users:\s*defineTable\(\{/);
  assert.match(source, /subscriptions:\s*defineTable\(\{/);
  assert.match(source, /repos:\s*defineTable\(\{/);
  assert.match(source, /drafts:\s*defineTable\(\{/);
  assert.doesNotMatch(source, /posts:\s*defineTable\(\{/);
});

test("users table stores Clerk identity and optional external account tokens", async () => {
  const source = await read("convex/schema.ts");

  assert.match(source, /clerkTokenIdentifier:\s*v\.string\(\)/);
  assert.match(source, /email:\s*v\.string\(\)/);
  assert.match(source, /githubId:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /xUserId:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /xAccessToken:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /xRefreshToken:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /xConnectedAt:\s*v\.optional\(v\.number\(\)\)/);
});

test("subscriptions table captures Lemon Squeezy state and post usage", async () => {
  const source = await read("convex/schema.ts");

  assert.match(source, /userId:\s*v\.id\("users"\)/);
  assert.match(source, /lemonCustomerId:\s*v\.string\(\)/);
  assert.match(source, /lemonSubscriptionId:\s*v\.string\(\)/);
  assert.match(source, /plan:\s*v\.union\(\s*v\.literal\("good"\),\s*v\.literal\("better"\),?\s*\)/s);
  assert.match(source, /status:\s*v\.union\(\s*v\.literal\("active"\),\s*v\.literal\("past_due"\),\s*v\.literal\("canceled"\),?\s*\)/s);
  assert.match(source, /currentPeriodEnd:\s*v\.number\(\)/);
  assert.match(source, /postsThisPeriod:\s*v\.number\(\)/);
});

test("repos and drafts tables support the commit to posted draft flow", async () => {
  const source = await read("convex/schema.ts");

  assert.match(source, /githubRepoId:\s*v\.string\(\)/);
  assert.match(source, /fullName:\s*v\.string\(\)/);
  assert.match(source, /webhookId:\s*v\.string\(\)/);
  assert.match(source, /connectedAt:\s*v\.number\(\)/);
  assert.match(source, /repoId:\s*v\.id\("repos"\)/);
  assert.match(source, /commitSha:\s*v\.string\(\)/);
  assert.match(source, /commitMessage:\s*v\.string\(\)/);
  assert.match(source, /variants:\s*v\.array\(v\.string\(\)\)/);
  assert.match(source, /chosenText:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /mediaId:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /status:\s*v\.union\(\s*v\.literal\("draft"\),\s*v\.literal\("posted"\),\s*v\.literal\("discarded"\),?\s*\)/s);
  assert.match(source, /xPostId:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /postedAt:\s*v\.optional\(v\.number\(\)\)/);
});

test("schema defines the indexes needed by upcoming core tasks", async () => {
  const source = await read("convex/schema.ts");

  for (const indexName of [
    "by_clerkTokenIdentifier",
    "by_email",
    "by_githubId",
    "by_xUserId",
    "by_userId",
    "by_userId_and_status_and_currentPeriodEnd",
    "by_lemonCustomerId",
    "by_lemonSubscriptionId",
    "by_status",
    "by_githubRepoId",
    "by_userId_and_githubRepoId",
    "by_userId_and_status",
    "by_repoId_and_commitSha",
  ]) {
    assert.match(source, new RegExp(`\\.index\\("${indexName}"`));
  }
});
