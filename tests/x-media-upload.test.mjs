import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Convex HTTP exposes an authenticated X media upload route", async () => {
  const source = await read("convex/http.ts");
  const routeSource = source.slice(
    source.indexOf('path: "/x/media/upload"'),
    source.indexOf('path: "/lemon-squeezy/webhook"'),
  );

  assert.match(source, /path:\s*"\/x\/media\/upload"/);
  assert.match(routeSource, /method:\s*"POST"/);
  assert.match(routeSource, /httpAction\(async \(ctx,\s*req\)/);
  assert.match(routeSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(routeSource, /identity\.tokenIdentifier/);
  assert.match(routeSource, /Content-Length/);
  assert.match(routeSource, /Number\.isFinite\(contentLength\)/);
  assert.match(routeSource, /req\.formData\(\)/);
  assert.match(routeSource, /draftId/);
  assert.match(routeSource, /file/);
  assert.doesNotMatch(routeSource, /userId:\s*v\./);
});

test("media upload route validates one small image and stores returned media id", async () => {
  const httpSource = await read("convex/http.ts");
  const xSource = await read("convex/x.ts");
  const xApiSource = await read("convex/xApi.ts");
  const routeSource = httpSource.slice(
    httpSource.indexOf('path: "/x/media/upload"'),
    httpSource.indexOf('path: "/lemon-squeezy/webhook"'),
  );

  assert.match(routeSource, /MAX_TWEET_IMAGE_BYTES/);
  assert.match(httpSource, /5 \* 1024 \* 1024/);
  assert.match(routeSource, /ALLOWED_TWEET_IMAGE_TYPES/);
  assert.match(httpSource, /image\/png/);
  assert.match(httpSource, /image\/jpeg/);
  assert.match(httpSource, /image\/webp/);
  assert.match(routeSource, /file\.size > MAX_TWEET_IMAGE_BYTES/);
  assert.match(routeSource, /uploadTweetImage\(\{/);
  assert.match(routeSource, /mediaCategory:\s*"tweet_image"/);
  assert.match(routeSource, /catch \(err\)/);
  assert.match(routeSource, /jsonError\(errorMessage\(err,\s*"Image upload failed\."\)/);
  assert.match(routeSource, /ctx\.runMutation\(internal\.x\.storeDraftMedia/);
  assert.match(xSource, /export const getDraftForMediaUpload = internalQuery\(\{/);
  assert.match(xSource, /draft\.status !== "draft"/);
  assert.match(xSource, /export const storeDraftMedia = internalMutation\(\{/);
  assert.match(xSource, /mediaId:\s*args\.mediaId/);
  assert.match(xApiSource, /const X_MEDIA_UPLOAD_URL = "https:\/\/api\.x\.com\/2\/media\/upload"/);
  assert.match(xApiSource, /uploadOneShotTweetImage\(\{/);
  assert.match(xApiSource, /body\.append\("media",\s*file/);
  assert.match(xApiSource, /body\.append\("media_category",\s*mediaCategory\)/);
  assert.match(xApiSource, /body\.append\("media_type",\s*mediaType\)/);
  assert.doesNotMatch(xApiSource, /body\.append\("command"/);
  assert.doesNotMatch(xApiSource, /body\.append\("total_bytes"/);
  assert.doesNotMatch(xApiSource, /body\.append\("segment_index"/);
});

test("media upload falls back to legacy OAuth 1.0a upload when v2 is forbidden", async () => {
  const httpSource = await read("convex/http.ts");
  const xSource = await read("convex/x.ts");
  const xApiSource = await read("convex/xApi.ts");

  assert.match(xApiSource, /const X_LEGACY_MEDIA_UPLOAD_URL = "https:\/\/upload\.twitter\.com\/1\.1\/media\/upload\.json"/);
  assert.match(xApiSource, /type LegacyMediaUploadCredentials/);
  assert.match(xApiSource, /legacyCredentials\?:\s*LegacyMediaUploadCredentials/);
  assert.match(xApiSource, /isXMediaUploadHttpError\(err\)/);
  assert.match(xApiSource, /err\.status === 403/);
  assert.match(xApiSource, /uploadLegacyTweetImage\(\{/);
  assert.match(xApiSource, /oauth_signature_method:\s*"HMAC-SHA1"/);
  assert.match(xApiSource, /legacyOAuthAuthorizationHeader\(\{/);
  assert.match(xApiSource, /body\.append\("additional_owners",\s*credentials\.ownerUserId\)/);
  assert.match(xApiSource, /media_id_string/);
  assert.match(httpSource, /legacyMediaUploadCredentials\(\s*refreshedContext\.xUserId/s);
  assert.match(xSource, /xUserId:\s*v\.string\(\)/);
  assert.match(xSource, /xUserId:\s*user\.xUserId/);
});

test("media upload records safe diagnostics for X failures", async () => {
  const source = await read("convex/xApi.ts");

  assert.match(source, /type MediaUploadLogContext =/);
  assert.match(source, /attemptId:\s*randomBase64Url\(12\)/);
  assert.match(source, /logXMediaUpload\("x_media_upload_start"/);
  assert.match(source, /logXMediaUpload\("x_media_upload_request_succeeded"/);
  assert.match(source, /warnXMediaUpload\("x_media_upload_request_failed"/);
  assert.match(source, /warnXMediaUpload\("x_media_upload_legacy_fallback"/);
  assert.match(source, /xResponseLogFields\(response\)/);
  assert.match(source, /xResponseErrorLogFields\(response\)/);
  assert.match(source, /xErrorPayloadLogFields\(payload\)/);
  assert.match(source, /xErrorTitle/);
  assert.match(source, /xErrorDetail/);
  assert.match(source, /slice\(0,\s*240\)/);
  assert.match(source, /"x-request-id"/);
  assert.match(source, /"x-rate-limit-remaining"/);
  assert.doesNotMatch(source, /await response\.text\(\)/);
  assert.doesNotMatch(source, /responseBody/);
  assert.doesNotMatch(
    source,
    /console\.(?:info|warn)\([^)]*(accessToken|consumerSecret|accessTokenSecret|Authorization|oauth_)/s,
  );
});

test("media upload reports text-only fallback when both native upload paths are unavailable", async () => {
  const source = await read("convex/xApi.ts");

  assert.match(source, /X image upload is unavailable for this X API configuration\./);
  assert.match(source, /Post text-only or configure legacy X media upload credentials\./);
  assert.match(source, /safeXLegacyMediaUploadErrorMessage\(response\.status\)/);
  assert.match(source, /case 401:\s*\n\s*case 403:\s*\n\s*return "X image upload is unavailable/s);
});

test("createXPost attaches media ids only when a media id is present", async () => {
  const xSource = await read("convex/x.ts");
  const xApiSource = await read("convex/xApi.ts");

  assert.match(xSource, /mediaId:\s*claimedDraft\.mediaId/);
  assert.match(xApiSource, /mediaId\?:\s*string/);
  assert.match(xApiSource, /const body:\s*CreateXPostBody = \{\s*text\s*\}/s);
  assert.match(xApiSource, /if \(mediaId\)/);
  assert.match(xApiSource, /media_ids:\s*\[mediaId\]/);
});

test("subscriber review screen uploads one optional image with a Convex auth token", async () => {
  const source = await read("components/drafts-workspace.tsx");

  assert.match(source, /useAuth/);
  assert.match(source, /getToken\(\{\s*template:\s*"convex"\s*\}\)/s);
  assert.match(source, /NEXT_PUBLIC_CONVEX_SITE_URL/);
  assert.match(source, /\/x\/media\/upload/);
  assert.match(source, /new FormData\(\)/);
  assert.match(source, /formData\.append\("draftId"/);
  assert.match(source, /formData\.append\("file"/);
  assert.match(source, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(source, /response\.json\(\)\.catch/);
  assert.match(source, /!isUploading/);
  assert.match(source, /type="file"/);
  assert.match(source, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(source, /No image attached/);
});
