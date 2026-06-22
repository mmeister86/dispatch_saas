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

test("/settings route renders the settings workspace", async () => {
  assert.equal(await pathExists("app/settings/page.tsx"), true);
  assert.equal(await pathExists("components/settings-workspace.tsx"), true);

  const pageSource = await read("app/settings/page.tsx");
  const settingsSource = await read("components/settings-workspace.tsx");

  assert.match(pageSource, /SettingsWorkspace/);
  assert.match(settingsSource, /api\.billing\.currentAccess/);
  assert.match(settingsSource, /api\.billing\.createBillingPortal/);
  assert.match(settingsSource, /api\.github\.connectedRepos/);
  assert.match(settingsSource, /api\.github\.completeInstallation/);
  assert.match(settingsSource, /api\.github\.connectInstalledRepository/);
  assert.match(settingsSource, /api\.github\.disconnectRepo/);
  assert.match(settingsSource, /installation_id/);
  assert.match(settingsSource, /Install GitHub App/);
  assert.match(settingsSource, /Disconnect/);
  assert.match(settingsSource, /Open billing portal/);
  assert.match(settingsSource, /window\.location\.assign\(portal\.url\)/);
});

test("GitHub exposes a server-authorized local disconnect mutation", async () => {
  const source = await read("convex/github.ts");
  const disconnectSource = source.slice(
    source.indexOf("export const disconnectRepo"),
    source.indexOf("export const requireActiveUserAccess"),
  );

  assert.match(source, /export const disconnectRepo = mutation\(\{/);
  assert.match(disconnectSource, /githubRepoId:\s*v\.string\(\)/);
  assert.match(disconnectSource, /returns:\s*v\.object\(\{\s*disconnected:\s*v\.boolean\(\)/s);
  assert.match(disconnectSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(disconnectSource, /identity\.tokenIdentifier/);
  assert.match(disconnectSource, /internal\.github\.requireActiveUserAccess/);
  assert.match(disconnectSource, /by_userId_and_githubRepoId/);
  assert.match(disconnectSource, /q\.eq\("userId",\s*access\.userId\)\.eq\("githubRepoId",\s*args\.githubRepoId\)/);
  assert.match(disconnectSource, /ctx\.db\.delete\(repo\._id\)/);
  assert.match(disconnectSource, /disconnected:\s*true/);
  assert.match(disconnectSource, /disconnected:\s*false/);
  assert.doesNotMatch(disconnectSource, /drafts/);
  assert.doesNotMatch(disconnectSource, /api\.github\.com/);
});

test("settings can show and disconnect over-limit local repos after downgrades", async () => {
  const githubSource = await read("convex/github.ts");
  const settingsSource = await read("components/settings-workspace.tsx");
  const connectedReposSource = githubSource.slice(
    githubSource.indexOf("export const connectedRepos"),
    githubSource.indexOf("export const completeInstallation"),
  );

  assert.match(connectedReposSource, /\.take\(REPO_LIMITS\.better \+ 1\)/);
  assert.doesNotMatch(connectedReposSource, /\.take\(access\.repoLimit\)/);
  assert.match(connectedReposSource, /repoCount:\s*repos\.length/);
  assert.match(settingsSource, /repoCount > repoLimit/);
  assert.match(settingsSource, /Disconnect extra repos/);
});

test("settings can reload installed GitHub repositories after the initial callback", async () => {
  const schemaSource = await read("convex/schema.ts");
  const githubSource = await read("convex/github.ts");
  const settingsSource = await read("components/settings-workspace.tsx");
  const usersSource = schemaSource.slice(
    schemaSource.indexOf("users: defineTable"),
    schemaSource.indexOf("subscriptions: defineTable"),
  );
  const installedOptionsSource = githubSource.slice(
    githubSource.indexOf("export const installedRepositoryOptions"),
    githubSource.indexOf("export const requireActiveUserAccess"),
  );

  assert.match(usersSource, /githubInstallationId:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(githubSource, /export const installedRepositoryOptions = action\(\{/);
  assert.match(installedOptionsSource, /internal\.github\.currentGitHubInstallation/);
  assert.match(installedOptionsSource, /listInstallationRepositories\(installationId\)/);
  assert.match(installedOptionsSource, /installationId,\s*repositories/s);
  assert.match(githubSource, /export const rememberGitHubInstallation = internalMutation\(\{/);
  assert.match(githubSource, /export const currentGitHubInstallation = internalQuery\(\{/);
  assert.match(githubSource, /internal\.github\.rememberGitHubInstallation/);
  assert.match(settingsSource, /api\.github\.installedRepositoryOptions/);
  assert.match(settingsSource, /Choose installed repo/);
  assert.match(settingsSource, /installationId:\s*result\.installationId/);
});

test("disconnect preserves a legacy repo installation id before deleting the row", async () => {
  const githubSource = await read("convex/github.ts");
  const disconnectSource = githubSource.slice(
    githubSource.indexOf("export const disconnectRepo"),
    githubSource.indexOf("export const requireActiveUserAccess"),
  );

  assert.match(disconnectSource, /internal\.github\.rememberGitHubInstallation/);
  assert.match(disconnectSource, /githubInstallationId:\s*repo\.githubInstallationId/);

  const rememberIndex = disconnectSource.indexOf(
    "internal.github.rememberGitHubInstallation",
  );
  const deleteIndex = disconnectSource.indexOf("ctx.db.delete(repo._id)");

  assert.ok(rememberIndex > -1);
  assert.ok(deleteIndex > rememberIndex);
});

test("billing portal action fetches a fresh Lemon Squeezy customer portal URL", async () => {
  const source = await read("convex/billing.ts");
  const schema = await read("convex/schema.ts");
  const portalSource = source.slice(
    source.indexOf("export const createBillingPortal"),
    source.indexOf("export const hasActiveSubscriptionForUser"),
  );

  assert.match(source, /export const createBillingPortal = action\(\{/);
  assert.match(portalSource, /args:\s*\{\}/);
  assert.match(portalSource, /returns:\s*v\.object\(\{\s*url:\s*v\.string\(\)/s);
  assert.match(portalSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(portalSource, /identity\.tokenIdentifier/);
  assert.match(portalSource, /internal\.billing\.activeSubscriptionForBillingPortal/);
  assert.match(portalSource, /subscription\.lemonSubscriptionId/);
  assert.match(source, /export const activeSubscriptionForBillingPortal = internalQuery\(\{/);
  assert.match(source, /getActiveSubscription\(ctx,\s*user\._id\)/);
  assert.match(source, /https:\/\/api\.lemonsqueezy\.com\/v1\/subscriptions\/\$\{subscriptionId\}/);
  assert.match(source, /attributes\?\.urls\?\.customer_portal/);
  assert.match(source, /Authorization:\s*`Bearer \$\{env\.LEMONSQUEEZY_API_KEY\}`/);
  assert.doesNotMatch(schema, /customerPortal|billingPortal|portalUrl/);
});

test("home and drafts link to settings while settings owns repo management", async () => {
  const homeSource = await read("app/page.tsx");
  const draftsSource = await read("components/drafts-workspace.tsx");

  assert.match(homeSource, /href="\/settings"/);
  assert.match(homeSource, /Manage settings/);
  assert.match(draftsSource, /href="\/settings"/);
  assert.match(draftsSource, /Settings/);
  assert.doesNotMatch(homeSource, /function GitHubRepoPanel/);
  assert.doesNotMatch(homeSource, /api\.github\.connectedRepos/);
});
