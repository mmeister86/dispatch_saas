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

test("onboarding exposes the required Convex API surface", async () => {
  assert.equal(await pathExists("convex/onboarding.ts"), true);

  const source = await read("convex/onboarding.ts");

  assert.match(source, /export const status = query\(\{/);
  assert.match(source, /export const calibrateFromX = action\(\{/);
  assert.match(source, /export const calibrateFromPosts = action\(\{/);
  assert.match(source, /export const updateVoiceProfileDraft = mutation\(\{/);
  assert.match(source, /export const rejectVoiceProfile = mutation\(\{/);
  assert.match(source, /export const confirmVoiceProfile = mutation\(\{/);
  assert.match(source, /export const importRecentCommitDrafts = action\(\{/);
  assert.match(source, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(source, /identity\.tokenIdentifier/);
});

test("onboarding status tracks voice confirmation and first draft activation", async () => {
  const source = await read("convex/onboarding.ts");
  const statusSource = source.slice(
    source.indexOf("export const status"),
    source.indexOf("export const calibrateFromX"),
  );

  assert.match(statusSource, /voiceProfile/);
  assert.match(statusSource, /confirmedAt/);
  assert.match(statusSource, /firstDraft/);
  assert.match(statusSource, /onboarding/);
  assert.match(source, /by_userId/);
  assert.match(source, /by_userId_and_status/);
  assert.match(source, /\.take\(20\)/);
  assert.match(source, /candidate\.variants\.length > 0/);
  assert.match(source, /\.take\(1\)/);
});

test("X voice import fetches only recent own posts and never stores raw posts", async () => {
  const source = await read("convex/onboarding.ts");
  const importSource = source.slice(
    source.indexOf("export const calibrateFromX"),
    source.indexOf("export const calibrateFromPosts"),
  );

  assert.match(importSource, /xUserId/);
  assert.match(importSource, /xAccessToken/);
  assert.match(importSource, /refreshUserToken/);
  assert.match(source, /\/2\/users\/\$\{xUserId\}\/tweets/);
  assert.match(source, /max_results",\s*String\(X_RECENT_POSTS_LIMIT\)/);
  assert.match(source, /tweet\.fields",\s*"created_at"/);
  assert.match(importSource, /source:\s*"x_import"/);
  assert.match(importSource, /storeVoiceProfileDraft/);
  assert.doesNotMatch(importSource, /ctx\.db\.insert\([^)]*posts/s);
  assert.doesNotMatch(importSource, /rawTweets|tweetTexts/);
});

test("manual calibration requires 3-5 pasted posts and stores a derived profile draft", async () => {
  const source = await read("convex/onboarding.ts");
  const pasteSource = source.slice(
    source.indexOf("export const calibrateFromPosts"),
    source.indexOf("export const confirmVoiceProfile"),
  );

  assert.match(pasteSource, /posts:\s*v\.array\(v\.string\(\)\)/);
  assert.match(source, /const MIN_MANUAL_POSTS = 3/);
  assert.match(source, /const MAX_MANUAL_POSTS = 5/);
  assert.match(pasteSource, /posts\.length < MIN_MANUAL_POSTS/);
  assert.match(pasteSource, /posts\.length > MAX_MANUAL_POSTS/);
  assert.match(pasteSource, /source:\s*"manual_paste"/);
  assert.match(pasteSource, /storeVoiceProfileDraft/);
});

test("voice profile review can edit or reject the derived draft before confirmation", async () => {
  const source = await read("convex/onboarding.ts");
  const updateSource = source.slice(
    source.indexOf("export const updateVoiceProfileDraft"),
    source.indexOf("export const rejectVoiceProfile"),
  );
  const rejectSource = source.slice(
    source.indexOf("export const rejectVoiceProfile"),
    source.indexOf("export const confirmVoiceProfile"),
  );

  assert.match(updateSource, /summary:\s*v\.string\(\)/);
  assert.match(updateSource, /rules:\s*v\.array\(v\.string\(\)\)/);
  assert.match(updateSource, /normalizeProfileSummary\(args\.summary\)/);
  assert.match(updateSource, /normalizeRules\(args\.rules\)/);
  assert.match(updateSource, /confirmedAt:\s*undefined/);
  assert.match(updateSource, /profileToView/);
  assert.match(rejectSource, /ctx\.db\.delete\(profile\._id\)/);
  assert.match(rejectSource, /rejected:\s*v\.boolean\(\)/);
});

test("recent commit import uses GitHub commits API and creates onboarding drafts for up to five commits", async () => {
  const source = await read("convex/onboarding.ts");
  const importSource = source.slice(
    source.indexOf("export const importRecentCommitDrafts"),
  );

  assert.match(importSource, /confirmedAt/);
  assert.match(importSource, /githubInstallationId/);
  assert.match(source, /const RECENT_COMMITS_IMPORT_LIMIT = 5/);
  assert.match(importSource, /\/repos\/\$\{owner\}\/\$\{repoName\}\/commits/);
  assert.match(importSource, /per_page",\s*String\(RECENT_COMMITS_IMPORT_LIMIT\)/);
  assert.match(importSource, /for \(const commit of recentCommits\)/);
  assert.match(importSource, /internal\.generation\.generateCommitVariants/);
  assert.match(importSource, /voiceProfile:\s*\{/);
  assert.match(importSource, /upsertOnboardingDraft/);
  assert.match(importSource, /drafts:\s*v\.array/);
  assert.match(importSource, /drafts\.push/);
  assert.match(importSource, /commitSha/);
  assert.match(importSource, /commitMessage/);
});

test("dashboard has a guided onboarding route and gates active subscribers into it", async () => {
  assert.equal(await pathExists("app/dashboard/onboarding/page.tsx"), true);
  assert.equal(await pathExists("components/dashboard/onboarding-workspace.tsx"), true);

  const overviewSource = await read("components/dashboard/dashboard-overview.tsx");
  const onboardingSource = await read("components/dashboard/onboarding-workspace.tsx");
  const pageSource = await read("app/dashboard/onboarding/page.tsx");

  assert.match(overviewSource, /api\.onboarding\.status/);
  assert.match(overviewSource, /\/dashboard\/onboarding/);
  assert.match(overviewSource, /Complete onboarding/);
  assert.match(pageSource, /OnboardingWorkspace/);
  assert.match(onboardingSource, /api\.onboarding\.status/);
  assert.match(onboardingSource, /api\.onboarding\.calibrateFromX/);
  assert.match(onboardingSource, /api\.onboarding\.calibrateFromPosts/);
  assert.match(onboardingSource, /api\.onboarding\.updateVoiceProfileDraft/);
  assert.match(onboardingSource, /api\.onboarding\.rejectVoiceProfile/);
  assert.match(onboardingSource, /api\.onboarding\.confirmVoiceProfile/);
  assert.match(onboardingSource, /api\.onboarding\.importRecentCommitDrafts/);
  assert.match(onboardingSource, /GitHubRepoPanel/);
  assert.match(onboardingSource, /Paste 3-5 posts/);
  assert.match(onboardingSource, /Import from X/);
  assert.match(onboardingSource, /Open first draft/);
});

test("onboarding starts X OAuth directly instead of sending users to settings", async () => {
  const onboardingSource = await read("components/dashboard/onboarding-workspace.tsx");

  assert.match(onboardingSource, /useAction\(api\.x\.startConnection\)/);
  assert.match(onboardingSource, /startXConnection\(\{\s*returnPath:\s*"\/dashboard\/onboarding",?\s*\}\)/);
  assert.match(onboardingSource, /window\.location\.assign\(connection\.url\)/);
  assert.match(onboardingSource, /Connect X/);
  assert.doesNotMatch(onboardingSource, /href="\/dashboard\/settings"[\s\S]*Connect X/);
});

test("onboarding voice profile card exposes edit, reject, and regenerate controls", async () => {
  const onboardingSource = await read("components/dashboard/onboarding-workspace.tsx");

  assert.match(onboardingSource, /const updateVoiceProfileDraft = useMutation\(api\.onboarding\.updateVoiceProfileDraft\)/);
  assert.match(onboardingSource, /const rejectVoiceProfile = useMutation\(api\.onboarding\.rejectVoiceProfile\)/);
  assert.match(onboardingSource, /function handleUpdateProfile/);
  assert.match(onboardingSource, /function handleRejectProfile/);
  assert.match(onboardingSource, /onRegenerateFromX/);
  assert.match(onboardingSource, /Edit profile/);
  assert.match(onboardingSource, /Save changes/);
  assert.match(onboardingSource, /Reject profile/);
  assert.match(onboardingSource, /Regenerate from X/);
});

test("onboarding starts GitHub installation directly instead of sending users to settings", async () => {
  const onboardingSource = await read("components/dashboard/onboarding-workspace.tsx");
  const settingsSource = await read("components/settings-workspace.tsx");

  assert.match(onboardingSource, /import \{ GitHubRepoPanel \} from "@\/components\/settings-workspace"/);
  assert.match(onboardingSource, /<GitHubRepoPanel\s+installReturnPath="\/dashboard\/onboarding"\s+variant="embedded"/);
  assert.doesNotMatch(onboardingSource, /href="\/dashboard\/settings"[\s\S]*Connect GitHub repo/);
  assert.match(settingsSource, /export function GitHubRepoPanel/);
  assert.match(settingsSource, /GITHUB_INSTALL_RETURN_PATH_KEY/);
  assert.match(settingsSource, /rememberGitHubInstallReturnPath\(installReturnPath\)/);
  assert.match(settingsSource, /redirectStoredGitHubInstallReturn\(installationId\)/);
});
