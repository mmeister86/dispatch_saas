import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("draft review canvas makes variant selection, editing, and post readiness explicit", async () => {
  const source = await read("components/drafts-workspace.tsx");
  const editorSource = source.slice(
    source.indexOf("function DraftEditorCanvas"),
    source.indexOf("function groupDraftsByRepo"),
  );
  const variantButtonSource = editorSource.slice(
    editorSource.indexOf("draft.variants.map"),
    editorSource.indexOf("<textarea"),
  );

  assert.match(source, /api\.drafts\.listForReview/);
  assert.match(source, /api\.x\.postDraft/);
  assert.match(source, /api\.x\.connectionStatus/);
  assert.match(source, /postDraft\(\{\s*draftId:\s*draft\._id,\s*text\s*\}\)/s);
  assert.match(editorSource, /const trimmedText = selectedText\.trim\(\)/);
  assert.match(editorSource, /trimmedText\.length <= 280/);
  assert.match(editorSource, /maxLength=\{280\}/);
  assert.match(editorSource, /onChange=\{\(event\) => onTextChange\(event\.target\.value\)\}/);
  assert.match(editorSource, /isSelectedVariant/);
  assert.match(editorSource, /aria-pressed=\{isSelectedVariant\}/);
  assert.doesNotMatch(variantButtonSource, /aria-label=/);
  assert.match(editorSource, /Selected variant/);
  assert.match(editorSource, /postReadinessMessage/);
  assert.match(editorSource, /Ready to publish to X\./);
  assert.match(editorSource, /Shorten the post to 280 characters before publishing\./);
  assert.match(editorSource, /Pick or write a post before publishing\./);
});

test("draft review keeps image upload optional and exposes accessible status feedback", async () => {
  const source = await read("components/drafts-workspace.tsx");
  const editorSource = source.slice(
    source.indexOf("function DraftEditorCanvas"),
    source.indexOf("function groupDraftsByRepo"),
  );

  assert.match(source, /NEXT_PUBLIC_CONVEX_SITE_URL/);
  assert.match(source, /\/x\/media\/upload/);
  assert.match(source, /formData\.append\("draftId"/);
  assert.match(source, /formData\.append\("file"/);
  assert.match(source, /mediaUploadStateByDraftId/);
  assert.match(source, /mediaUploadRecoveryByDraftId/);
  assert.match(source, /previousXConnectedAt/);
  assert.match(source, /clearReconnectUploadFailures/);
  assert.match(source, /fileInputResetKeyByDraftId/);
  assert.match(source, /setFileInputResetKeyByDraftId/);
  assert.match(source, /type MediaUploadState = "idle" \| "uploading" \| "attached" \| "failed"/);
  assert.match(source, /type MediaUploadRecovery = "retry" \| "reconnect" \| "unavailable"/);
  assert.match(source, /isReconnectUploadFailure/);
  assert.match(source, /\[draft\._id\]: "attached"/);
  assert.match(source, /\[draft\._id\]: "failed"/);
  assert.match(source, /const uploadRecovery = isReconnectUploadFailure\(message\)/);
  assert.match(source, /\[draft\._id\]: uploadRecovery/);
  assert.match(source, /isUnavailableUploadFailure\(message\)/);
  assert.match(source, /\[draft\._id\]: "retry"/);
  assert.match(source, /uploadRecovery !== "reconnect"/);
  assert.match(source, /delete next\[draftId\]/);
  assert.match(editorSource, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(editorSource, /key=\{fileInputResetKey\}/);
  assert.match(editorSource, /No image attached\./);
  assert.match(editorSource, /Image was not attached\./);
  assert.match(editorSource, /Image attached\./);
  assert.match(
    editorSource,
    /Text-only post is ready\. Reconnect X and upload again to include an image\./,
  );
  assert.match(
    editorSource,
    /Text-only post is ready\. Choose the image again to include it\./,
  );
  assert.match(
    editorSource,
    /Text-only post is ready\. Image upload is unavailable for this X API configuration\./,
  );
  assert.match(editorSource, /Post without an image for now\./);
  assert.match(editorSource, /uploadRecovery === "reconnect"/);
  assert.match(editorSource, /uploadRecovery === "unavailable"/);
  assert.doesNotMatch(editorSource, /Attached media \$\{draft\.mediaId\}/);
  assert.doesNotMatch(editorSource, /Text-only is ready\./);
  assert.match(editorSource, /aria-live="polite"/);
  assert.match(editorSource, /role="status"/);
  assert.match(editorSource, /role="alert"/);
  assert.match(editorSource, /Posted to X/);
});
