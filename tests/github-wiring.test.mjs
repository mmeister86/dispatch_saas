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

test("Convex app declares GitHub connection environment variables", async () => {
  const source = await read("convex/convex.config.ts");

  for (const name of [
    "GITHUB_APP_ID",
    "GITHUB_APP_PRIVATE_KEY",
    "GITHUB_APP_INSTALL_URL",
    "GITHUB_WEBHOOK_SECRET",
  ]) {
    assert.match(source, new RegExp(`${name}:\\s*v\\.string\\(\\)`));
  }

  assert.doesNotMatch(source, /CLERK_SECRET_KEY:\s*v\.string\(\)/);
  assert.doesNotMatch(source, /CONVEX_SITE_URL:\s*v\.string\(\)/);
});

test("GitHub actions derive the signed-in user and never accept client user ids", async () => {
  assert.equal(await pathExists("convex/github.ts"), true);

  const source = await read("convex/github.ts");

  for (const exportName of [
    "connectedRepos",
    "completeInstallation",
    "connectInstalledRepository",
  ]) {
    assert.match(source, new RegExp(`export const ${exportName}`));
  }

  assert.match(source, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(source, /identity\.tokenIdentifier/);
  assert.match(source, /hasActiveSubscriptionForUser/);

  const publicActionsSource = source.slice(0, source.indexOf("export const requireActiveUserAccess"));
  assert.doesNotMatch(publicActionsSource, /userId:\s*v\./);
});

test("GitHub connection uses GitHub App installation tokens instead of Clerk OAuth", async () => {
  const source = await read("convex/github.ts");
  const schema = await read("convex/schema.ts");

  assert.match(source, /env\.GITHUB_APP_ID/);
  assert.match(source, /env\.GITHUB_APP_PRIVATE_KEY/);
  assert.match(source, /createGitHubAppJwt/);
  assert.match(source, /\/app\/installations\/\$\{installationId\}\/access_tokens/);
  assert.match(source, /Authorization:\s*`Bearer \$\{appJwt\}`/);
  assert.match(source, /\/installation\/repositories\?per_page=100/);
  assert.match(source, /BEGIN RSA PRIVATE KEY/);
  assert.match(source, /wrapPkcs1PrivateKeyAsPkcs8/);
  assert.doesNotMatch(source, /oauth_access_tokens/);
  assert.doesNotMatch(source, /env\.CLERK_SECRET_KEY/);
  assert.doesNotMatch(source, /identity\.subject/);
  assert.doesNotMatch(source, /https:\/\/api\.github\.com\/user\/repos/);
  assert.doesNotMatch(schema, /githubAccessToken/);
  assert.doesNotMatch(source, /githubAccessToken:\s*/);
});

test("GitHub installation flow returns selectable installed repositories", async () => {
  const source = await read("convex/github.ts");

  assert.match(source, /completeInstallation/);
  assert.match(source, /kind:\s*"selectionRequired"/);
  assert.match(source, /kind:\s*"connected"/);
  assert.match(source, /connectInstalledRepository/);
  assert.match(source, /githubRepoId:\s*String\(repo\.id\)/);
  assert.match(source, /fullName:\s*repo\.full_name/);
  assert.match(source, /htmlUrl:\s*repo\.html_url/);
});

test("GitHub repo storage enforces Good and Better tier limits server-side", async () => {
  const source = await read("convex/github.ts");
  const schema = await read("convex/schema.ts");

  assert.match(source, /const REPO_LIMITS = \{\s*good:\s*1,\s*better:\s*5/s);
  assert.match(source, /repoLimitForPlan\(subscription\.plan\)/);
  assert.match(source, /existingRepos\.length >= args\.repoLimit/);
  assert.match(source, /Good supports 1 connected repo/);
  assert.match(source, /Better supports 5 connected repos/);
  assert.match(source, /ctx\.db\.insert\("repos"/);
  assert.match(source, /ctx\.db\.patch\(existing\._id/);
  assert.match(schema, /githubInstallationId:\s*v\.string\(\)/);
  assert.match(schema, /githubAccountLogin:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(schema, /by_userId_and_githubInstallationId/);
  assert.doesNotMatch(source, /\/repos\/\$\{owner\}\/\$\{repoName\}\/hooks/);
  assert.doesNotMatch(source, /webhookId/);
  assert.doesNotMatch(schema, /webhookId/);
});

test("Convex HTTP exposes a signed GitHub webhook endpoint for ping only", async () => {
  const source = await read("convex/http.ts");

  assert.match(source, /path:\s*"\/github\/webhook"/);
  assert.match(source, /method:\s*"POST"/);
  assert.match(source, /X-Hub-Signature-256/);
  assert.match(source, /env\.GITHUB_WEBHOOK_SECRET/);
  assert.match(source, /crypto\.subtle\.importKey/);
  assert.match(source, /sha256=/);
  assert.match(source, /X-GitHub-Event/);
  assert.match(source, /eventName === "ping"/);
  assert.match(source, /eventName !== "push"/);
  assert.match(source, /ctx\.runMutation\(internal\.http\.createDraftFromGithubPushWebhook/);
});

test("GitHub push webhooks create exactly one draft from the validated raw JSON body and schedule variant generation", async () => {
  const source = await read("convex/http.ts");
  const draftMutationSource = source.slice(
    source.indexOf("export const createDraftFromGithubPushWebhook"),
    source.indexOf("async function isValidSignature"),
  );

  assert.match(source, /if \(eventName !== "push"\)/);
  assert.match(source, /let payload: unknown;/);
  assert.match(source, /try \{\n\s+payload = JSON\.parse\(rawBody\);/);
  assert.match(source, /catch \{\n\s+return new Response\("Invalid JSON", \{ status: 400 \}\);/);
  assert.match(source, /isGitHubPushWebhookPayload\(payload\)/);
  assert.match(source, /return new Response\("Invalid JSON", \{ status: 400 \}\)/);
  assert.match(source, /function isGitHubRepository\(/);
  assert.match(source, /typeof value\.id === "string" \|\| typeof value\.id === "number"/);
  assert.match(draftMutationSource, /repos"\)\n\s+\.withIndex\("by_githubRepoId"/);
  assert.match(draftMutationSource, /\.take\(MAX_CONNECTED_REPOS_PER_PUSH\)/);
  assert.doesNotMatch(draftMutationSource, /by_githubRepoId"[\s\S]*?\.unique\(\)/);
  assert.match(draftMutationSource, /for \(const repo of repos\)/);
  assert.match(draftMutationSource, /drafts"\)\n\s+\.withIndex\("by_repoId_and_commitSha"/);
  assert.match(draftMutationSource, /\.take\(1\)/);
  assert.match(source, /isValidPushCommit\(payload\.head_commit\)/);
  assert.match(source, /typeof commit\.id === "string"/);
  assert.match(source, /typeof commit\.message === "string"/);
  assert.match(source, /payload\.commits\.find\(\(commit\) => commit\.id === after\)/);
  assert.match(source, /status:\s*"draft"/);
  assert.match(source, /variants:\s*\[\]/);
  assert.match(source, /ctx\.scheduler\.runAfter\(0,\s*internal\.generation\.populateDraftVariants/);
  assert.match(source, /draftId:\s*draftId/);
  assert.match(source, /commitMessage:\s*args\.commitMessage/);
  assert.match(source, /return new Response\("OK", \{ status: 200 \}\)/);
  assert.match(source, /isDeleteOrEmptyPush\(payload\)/);

  const existingDraftCheckIndex = draftMutationSource.indexOf(
    "if (existingDraft.length > 0)",
  );
  const insertIndex = draftMutationSource.indexOf(
    'const draftId = await ctx.db.insert("drafts"',
  );
  const schedulerIndex = draftMutationSource.indexOf(
    "ctx.scheduler.runAfter(0, internal.generation.populateDraftVariants",
  );

  assert.ok(existingDraftCheckIndex > -1);
  assert.ok(insertIndex > existingDraftCheckIndex);
  assert.ok(schedulerIndex > insertIndex);
});

test("settings workspace exposes the repo connection flow", async () => {
  const source = await read("components/settings-workspace.tsx");

  assert.match(source, /api\.github\.connectedRepos/);
  assert.match(source, /api\.github\.completeInstallation/);
  assert.match(source, /api\.github\.connectInstalledRepository/);
  assert.match(source, /api\.github\.disconnectRepo/);
  assert.match(source, /repoCount/);
  assert.match(source, /repoLimit/);
  assert.match(source, /Install GitHub App/);
  assert.match(source, /Disconnect/);
  assert.match(source, /href=\{installUrl\}/);
  assert.match(source, /installation_id/);
  assert.match(source, /Upgrade to Better/);
  assert.doesNotMatch(source, /window\.location\.assign\(installUrl\)/);
  assert.doesNotMatch(source, /Load repositories/);
});
