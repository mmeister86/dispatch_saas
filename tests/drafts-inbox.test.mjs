import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("drafts query returns the bounded newest-first inbox source", async () => {
  const source = await read("convex/drafts.ts");

  assert.match(source, /export const listForReview = query\(\{/);
  assert.match(source, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(source, /identity\.tokenIdentifier/);
  assert.match(source, /withIndex\("by_userId"/);
  assert.match(source, /\.order\("desc"\)/);
  assert.match(source, /\.take\(20\)/);
});

test("drafts route opens draft detail on a canvas from repository sidebar rows", async () => {
  const source = await read("components/drafts-workspace.tsx");
  const sidebarSource = source.slice(
    source.indexOf("<aside"),
    source.indexOf("<DraftEditorCanvas"),
  );
  const rowButtonSource = sidebarSource.slice(
    sidebarSource.indexOf("<button"),
    sidebarSource.indexOf("</button>"),
  );

  assert.match(source, /api\.github\.connectedRepos/);
  assert.match(source, /selectedDraftId/);
  assert.match(source, /setSelectedDraftId\(draft\._id\)/);
  assert.match(source, /DraftEditorCanvas/);
  assert.match(source, /groupDraftsByRepo/);
  assert.match(source, /No commit drafts yet/);
  assert.doesNotMatch(source, /role="dialog"|aria-modal|fixed inset-0/);
  assert.doesNotMatch(rowButtonSource, /<div/);
});
