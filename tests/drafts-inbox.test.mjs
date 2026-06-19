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

test("subscriber workspace opens draft detail in a modal from compact inbox rows", async () => {
  const source = await read("app/page.tsx");
  const inboxSource = source.slice(
    source.indexOf("Drafts inbox"),
    source.indexOf("{selectedDraft ?"),
  );
  const rowButtonSource = inboxSource.slice(
    inboxSource.indexOf("<button"),
    inboxSource.indexOf("</button>"),
  );

  assert.match(source, /Drafts inbox/);
  assert.match(source, /selectedDraftId/);
  assert.match(source, /setSelectedDraftId\(draft\._id\)/);
  assert.match(source, /DraftDetailModal/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /Escape/);
  assert.match(source, /previouslyFocusedElement/);
  assert.match(source, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(source, /event\.key === "Tab"/);
  assert.match(source, /ref=\{dialogRef\}/);
  assert.match(source, /formatDate\(draft\.createdAt\)/);
  assert.doesNotMatch(rowButtonSource, /<div/);
});
