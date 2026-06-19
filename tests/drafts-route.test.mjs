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

test("/drafts route renders the routed drafts workspace", async () => {
  assert.equal(await pathExists("app/drafts/page.tsx"), true);
  assert.equal(await pathExists("components/drafts-workspace.tsx"), true);

  const pageSource = await read("app/drafts/page.tsx");
  const workspaceSource = await read("components/drafts-workspace.tsx");

  assert.match(pageSource, /DraftsWorkspace/);
  assert.match(workspaceSource, /api\.github\.connectedRepos/);
  assert.match(workspaceSource, /api\.drafts\.listForReview/);
  assert.match(workspaceSource, /groupDraftsByRepo/);
  assert.match(workspaceSource, /<aside/);
  assert.match(workspaceSource, /<main/);
  assert.match(workspaceSource, /DraftEditorCanvas/);
  assert.match(workspaceSource, /selectedDraftId/);
  assert.match(workspaceSource, /setSelectedDraftId\(draft\._id\)/);
  assert.match(workspaceSource, /connectedRepoNames/);
  assert.match(workspaceSource, /unmatchedDraftRepoNames/);
  assert.match(workspaceSource, /Array\.from\(draftGroups\.keys\(\)\)/);
  assert.match(workspaceSource, /aria-label="Post text"/);
  assert.match(workspaceSource, /bg-\[#f3efe7\]/);
  assert.match(workspaceSource, /rounded-\[28px\]/);
  assert.match(workspaceSource, /shadow-\[0_24px_80px_rgba\(15,23,42,0\.18\)\]/);
  assert.match(workspaceSource, /aria-pressed=\{isSelected\}/);
  assert.match(workspaceSource, /lg:grid-cols-\[minmax\(360px,380px\)_minmax\(0,1fr\)\]/);
  assert.match(workspaceSource, /break-words/);
  assert.doesNotMatch(workspaceSource, /truncate/);
  assert.doesNotMatch(workspaceSource, /role="dialog"|aria-modal|fixed inset-0/);
});

test("home links to the routed drafts workspace instead of embedding the draft editor", async () => {
  const source = await read("app/page.tsx");

  assert.match(source, /href="\/drafts"/);
  assert.match(source, /Open drafts workspace/);
  assert.doesNotMatch(source, /api\.drafts\.listForReview/);
  assert.doesNotMatch(source, /function DraftReviewPanel/);
  assert.doesNotMatch(source, /function DraftDetailModal/);
});
