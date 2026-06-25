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

test("Convex admin overview is authorized only by server-side ADMIN_EMAIL", async () => {
  assert.equal(await pathExists("convex/admin.ts"), true);

  const configSource = await read("convex/convex.config.ts");
  const adminSource = await read("convex/admin.ts");
  const argsBlock = adminSource.slice(
    adminSource.indexOf("args:"),
    adminSource.indexOf("returns:"),
  );

  assert.match(configSource, /ADMIN_EMAIL:\s*v\.string\(\)/);
  assert.match(adminSource, /export const overview = query\(\{/);
  assert.match(adminSource, /args:\s*\{\}/);
  assert.doesNotMatch(argsBlock, /email:\s*v\.string\(\)/);
  assert.doesNotMatch(argsBlock, /userId:\s*v\.id\(/);
  assert.match(adminSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(adminSource, /env\.ADMIN_EMAIL/);
  assert.match(adminSource, /state:\s*v\.literal\("signedOut"\)/);
  assert.match(adminSource, /state:\s*v\.literal\("forbidden"\)/);
  assert.match(adminSource, /state:\s*v\.literal\("ready"\)/);
});

test("admin overview returns read-only all-time and 30-day operational metrics", async () => {
  const adminSource = await read("convex/admin.ts");

  for (const metric of [
    "users",
    "connectedRepos",
    "xConnectedUsers",
    "activeSubscriptions",
    "draftsTotal",
    "draftsDraft",
    "draftsPosted",
    "draftsDiscarded",
    "xPostsPosted",
    "newUsers",
    "newRepos",
    "newActiveSubscriptions",
    "xUsersConnected",
    "draftsCreated",
  ]) {
    assert.match(adminSource, new RegExp(`${metric}:\\s*v\\.number\\(\\)`));
  }

  assert.match(adminSource, /last30Days/);
  assert.match(adminSource, /recentActivity/);
  assert.match(adminSource, /thirtyDaysAgo/);
  assert.match(adminSource, /status === "posted"/);
  assert.match(adminSource, /xPostId/);
  assert.doesNotMatch(adminSource, /mutation\(\{/);
  assert.doesNotMatch(adminSource, /internalMutation\(\{/);
});

test("/admin route renders a standalone admin dashboard", async () => {
  assert.equal(await pathExists("app/admin/page.tsx"), true);
  assert.equal(await pathExists("components/admin/admin-overview.tsx"), true);

  const pageSource = await read("app/admin/page.tsx");
  const overviewSource = await read("components/admin/admin-overview.tsx");
  const sidebarSource = await read("components/dashboard/app-sidebar.tsx");

  assert.match(pageSource, /AdminOverview/);
  assert.match(overviewSource, /api\.admin\.overview/);
  assert.match(overviewSource, /Total users/);
  assert.match(overviewSource, /Connected repos/);
  assert.match(overviewSource, /X-connected users/);
  assert.match(overviewSource, /Active subscriptions/);
  assert.match(overviewSource, /Launch snapshot/);
  assert.match(overviewSource, /Exact until the first/);
  assert.match(overviewSource, /Drafts created/);
  assert.match(overviewSource, /X posts posted/);
  assert.match(overviewSource, /Sign in to view admin metrics/);
  assert.match(overviewSource, /You do not have access to this admin dashboard/);
  assert.doesNotMatch(sidebarSource, /href:\s*"\/admin"/);
});
