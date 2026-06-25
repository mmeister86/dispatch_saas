import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("drafts workspace gives a direct repo connection empty state", async () => {
  const source = await read("components/drafts-workspace.tsx");
  const emptyStateSource = source.slice(
    source.indexOf("function DraftsEmptyState"),
    source.indexOf("function RepoDraftGroup"),
  );

  assert.match(source, /const hasConnectedRepos = \(repos \?\? \[\]\)\.length > 0/);
  assert.match(source, /const hasDrafts = \(drafts \?\? \[\]\)\.length > 0/);
  assert.match(emptyStateSource, /Connect a repository first\./);
  assert.match(emptyStateSource, /Dispatch needs one GitHub repo before it can turn commits into X\s+drafts\./);
  assert.match(emptyStateSource, /href="\/dashboard\/settings"/);
  assert.match(emptyStateSource, /Open settings/);
});

test("drafts workspace explains the connected-repo no-commits state", async () => {
  const source = await read("components/drafts-workspace.tsx");
  const emptyStateSource = source.slice(
    source.indexOf("function DraftsEmptyState"),
    source.indexOf("function RepoDraftGroup"),
  );

  assert.match(emptyStateSource, /No commit drafts yet\./);
  assert.match(emptyStateSource, /Push to a connected repository and Dispatch will drop the generated\s+variants here\./);
  assert.match(emptyStateSource, /Open settings/);
  assert.match(emptyStateSource, /Select a commit draft\./);
});

test("drafts workspace does not show empty-state guidance while data loads", async () => {
  const source = await read("components/drafts-workspace.tsx");
  const detailSource = source.slice(
    source.indexOf('<section className="min-w-0">'),
    source.indexOf("function DraftsEmptyState"),
  );

  assert.match(detailSource, /isLoading \? \(/);
  assert.match(detailSource, /Loading draft detail\.\.\./);
  assert.ok(
    detailSource.indexOf("isLoading ? (") <
      detailSource.indexOf("<DraftsEmptyState"),
  );
});

test("draft review shows an over-cap alert while keeping posting disabled", async () => {
  const source = await read("components/drafts-workspace.tsx");
  const editorSource = source.slice(
    source.indexOf("function DraftEditorCanvas"),
    source.indexOf("function groupDraftsByRepo"),
  );

  assert.match(editorSource, /isCapped\s*\?/);
  assert.match(editorSource, /role="alert"/);
  assert.match(editorSource, /Monthly post cap reached\./);
  assert.match(editorSource, /You can keep editing this draft, but posting unlocks when the\s+billing period renews or your plan changes\./);
  assert.match(editorSource, /!isCapped/);
});

test("draft review turns X action failures into actionable reconnect or retry guidance", async () => {
  const source = await read("components/drafts-workspace.tsx");

  assert.match(source, /userFacingActionError/);
  assert.match(source, /Reconnect X before posting/);
  assert.match(source, /Open the X account panel from the workspace, reconnect, then try posting again\./);
  assert.match(source, /temporarily unavailable/);
  assert.match(source, /Try again in a minute; your draft was not posted\./);
});

test("expired X refresh failures are mapped before posting quota is claimed", async () => {
  const source = await read("convex/x.ts");
  const postDraftSource = source.slice(
    source.indexOf("export const postDraft"),
    source.indexOf("export const completeOAuthCallback"),
  );

  assert.match(postDraftSource, /try\s*\{\s*await ctx\.runAction\(internal\.x\.refreshUserToken/s);
  assert.match(postDraftSource, /X connection expired\. Reconnect X before posting\./);
  assert.ok(
    postDraftSource.indexOf("refreshUserToken") <
      postDraftSource.indexOf("claimDraftPosting"),
  );
});

test("X API failures use safe user-facing messages without response bodies", async () => {
  const source = await read("convex/xApi.ts");

  assert.match(source, /safeXPostErrorMessage\(response\.status\)/);
  assert.match(source, /safeXMediaUploadErrorMessage\(response\.status\)/);
  assert.match(source, /case 401:/);
  assert.match(source, /case 403:/);
  assert.match(source, /return "X connection expired\. Reconnect X before posting\."/);
  assert.match(source, /return "X connection expired\. Reconnect X before uploading media\."/);
  assert.match(source, /return "X image upload is unavailable for this X API configuration\. Post text-only or configure legacy X media upload credentials\."/);
  assert.match(source, /case 429:/);
  assert.match(source, /return "X is rate limiting posts right now\. Try again in a minute\."/);
  assert.match(source, /return "X is rate limiting media uploads right now\. Try again in a minute\."/);
  assert.match(source, /status >= 500/);
  assert.match(source, /return "X is temporarily unavailable\. Try again in a minute\."/);
  assert.match(source, /return "X post failed\. Try again\."/);
  assert.match(source, /return "X media upload failed\. Try again\."/);
  assert.doesNotMatch(source, /await response\.text\(\)/);
  assert.doesNotMatch(source, /responseBody/);
  assert.doesNotMatch(source, /X media upload failed: \$\{response\.status\}/);
});
