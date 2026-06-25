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

test("/dashboard/drafts route renders the routed drafts workspace", async () => {
  assert.equal(await pathExists("app/drafts/page.tsx"), true);
  assert.equal(await pathExists("app/dashboard/drafts/page.tsx"), true);
  assert.equal(await pathExists("components/drafts-workspace.tsx"), true);

  const legacyPageSource = await read("app/drafts/page.tsx");
  const pageSource = await read("app/dashboard/drafts/page.tsx");
  const workspaceSource = await read("components/drafts-workspace.tsx");

  assert.match(legacyPageSource, /redirect\("\/dashboard\/drafts"\)/);
  assert.match(pageSource, /DraftsWorkspace/);
  assert.match(workspaceSource, /api\.github\.connectedRepos/);
  assert.match(workspaceSource, /api\.drafts\.listForReview/);
  assert.match(workspaceSource, /groupDraftsByRepo/);
  assert.match(workspaceSource, /<aside/);
  assert.match(workspaceSource, /const Root = embedded \? "div" : "main"/);
  assert.doesNotMatch(workspaceSource, /<main/);
  assert.match(workspaceSource, /Draft queue/);
  assert.match(workspaceSource, /Review commit drafts\./);
  assert.match(workspaceSource, /xl:grid-cols-\[minmax\(280px,0\.75fr\)_minmax\(0,1\.25fr\)\]/);
  assert.match(workspaceSource, /DraftEditorCanvas/);
  assert.match(workspaceSource, /selectedDraftId/);
  assert.match(workspaceSource, /setSelectedDraftId\(draft\._id\)/);
  assert.match(workspaceSource, /connectedRepoNames/);
  assert.match(workspaceSource, /unmatchedDraftRepoNames/);
  assert.match(workspaceSource, /Array\.from\(draftGroups\.keys\(\)\)/);
  assert.match(workspaceSource, /aria-label="Post text"/);
  assert.match(workspaceSource, /rounded-lg border border-zinc-200 bg-white/);
  assert.doesNotMatch(workspaceSource, /bg-\[#171411\]/);
  assert.doesNotMatch(workspaceSource, /bg-\[#f3efe7\]/);
  assert.doesNotMatch(workspaceSource, /rounded-\[28px\]/);
  assert.doesNotMatch(workspaceSource, /shadow-\[0_24px_80px_rgba\(15,23,42,0\.18\)\]/);
  assert.match(workspaceSource, /aria-pressed=\{isSelected\}/);
  assert.match(workspaceSource, /break-words/);
  assert.doesNotMatch(workspaceSource, /truncate/);
  assert.doesNotMatch(workspaceSource, /role="dialog"|aria-modal|fixed inset-0/);
});

test("home links to the dashboard instead of embedding the draft editor", async () => {
  const source = await read("app/page.tsx");
  const navbarSource = await read("components/navbar11.tsx");

  assert.doesNotMatch(source, /router\.replace\("\/dashboard"\)/);
  assert.match(source, /dashboardHref="\/dashboard"/);
  assert.match(navbarSource, /label: "Dashboard"/);
  assert.doesNotMatch(source, /api\.drafts\.listForReview/);
  assert.doesNotMatch(source, /function DraftReviewPanel/);
  assert.doesNotMatch(source, /function DraftDetailModal/);
});
