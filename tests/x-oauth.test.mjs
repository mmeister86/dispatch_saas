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

test("Convex app declares X OAuth environment variables", async () => {
  const source = await read("convex/convex.config.ts");

  for (const name of [
    "X_CLIENT_ID",
    "X_CLIENT_SECRET",
    "X_OAUTH_REDIRECT_URI",
  ]) {
    assert.match(source, new RegExp(`${name}:\\s*v\\.string\\(\\)`));
  }

  for (const name of [
    "X_MEDIA_UPLOAD_CONSUMER_KEY",
    "X_MEDIA_UPLOAD_CONSUMER_SECRET",
    "X_MEDIA_UPLOAD_ACCESS_TOKEN",
    "X_MEDIA_UPLOAD_ACCESS_TOKEN_SECRET",
  ]) {
    assert.match(source, new RegExp(`${name}:\\s*v\\.optional\\(v\\.string\\(\\)\\)`));
  }
});

test("schema stores X tokens server-side and short-lived OAuth state", async () => {
  const source = await read("convex/schema.ts");

  assert.match(source, /xTokenExpiresAt:\s*v\.optional\(v\.number\(\)\)/);
  assert.match(source, /xUsername:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /xOAuthStates:\s*defineTable\(\{/);
  assert.match(source, /state:\s*v\.string\(\)/);
  assert.match(source, /codeVerifier:\s*v\.string\(\)/);
  assert.match(source, /returnPath:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(source, /userId:\s*v\.id\("users"\)/);
  assert.match(source, /expiresAt:\s*v\.number\(\)/);
  assert.match(source, /\.index\("by_state",\s*\["state"\]\)/);
  assert.match(source, /\.index\("by_userId",\s*\["userId"\]\)/);
});

test("X OAuth module derives identity server-side and exposes safe public functions", async () => {
  assert.equal(await pathExists("convex/x.ts"), true);

  const source = await read("convex/x.ts");
  const connectionStatusSource = source.slice(
    source.indexOf("export const connectionStatus"),
    source.indexOf("export const startConnection"),
  );
  const startConnectionSource = source.slice(
    source.indexOf("export const startConnection"),
    source.indexOf("export const completeOAuthCallback"),
  );

  assert.match(source, /export const connectionStatus = query\(\{/);
  assert.match(source, /export const startConnection = action\(\{/);
  assert.match(startConnectionSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(startConnectionSource, /identity\.tokenIdentifier/);
  assert.doesNotMatch(startConnectionSource, /userId:\s*v\./);
  assert.doesNotMatch(connectionStatusSource, /xAccessToken|xRefreshToken/);
  assert.match(connectionStatusSource, /connected:\s*v\.literal\(false\)/);
  assert.match(connectionStatusSource, /connected:\s*v\.literal\(true\)/);
  assert.match(connectionStatusSource, /username:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(connectionStatusSource, /connectedAt:\s*v\.optional\(v\.number\(\)\)/);
  assert.match(connectionStatusSource, /xConnectedAt/);
});

test("X OAuth start action builds an authorization URL with PKCE and launch scopes", async () => {
  const source = await read("convex/x.ts");
  const startConnectionSource = source.slice(
    source.indexOf("export const startConnection"),
    source.indexOf("export const consumeOAuthState"),
  );

  assert.match(source, /https:\/\/x\.com\/i\/oauth2\/authorize/);
  assert.match(startConnectionSource, /response_type/);
  assert.match(startConnectionSource, /code/);
  assert.match(startConnectionSource, /client_id/);
  assert.match(startConnectionSource, /redirect_uri/);
  assert.match(startConnectionSource, /state/);
  assert.match(startConnectionSource, /returnPath:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(startConnectionSource, /safeXReturnPath\(args\.returnPath\)/);
  assert.match(startConnectionSource, /code_challenge/);
  assert.match(startConnectionSource, /code_challenge_method/);
  assert.match(startConnectionSource, /S256/);
  assert.match(
    source,
    /tweet\.read tweet\.write media\.write users\.read offline\.access/,
  );
  assert.match(source, /crypto\.getRandomValues/);
  assert.match(source, /crypto\.subtle\.digest\(\s*"SHA-256"/);
});

test("X OAuth callback is handled by Convex HTTP and stores tokens through internal mutations", async () => {
  const httpSource = await read("convex/http.ts");
  const xSource = await read("convex/x.ts");

  assert.match(httpSource, /OAUTH_STATE_PATTERN/);
  assert.match(httpSource, /OAUTH_CODE_MAX_LENGTH/);
  assert.match(httpSource, /code\.length > OAUTH_CODE_MAX_LENGTH/);
  assert.match(httpSource, /!OAUTH_STATE_PATTERN\.test\(state\)/);
  assert.match(httpSource, /path:\s*"\/x\/oauth\/callback"/);
  assert.match(httpSource, /method:\s*"GET"/);
  assert.match(
    httpSource,
    /const result = await ctx\.runAction\(internal\.x\.completeOAuthCallback/,
  );
  assert.match(httpSource, /redirectToApp\("x=connected",\s*result\.returnPath\)/);
  assert.match(httpSource, /env\.APP_URL/);
  assert.match(httpSource, /\/dashboard\/settings/);
  assert.match(httpSource, /x=connected/);
  assert.match(httpSource, /x=error/);
  assert.match(httpSource, /"Cache-Control":\s*"no-store"/);
  assert.match(httpSource, /"Referrer-Policy":\s*"no-referrer"/);
  assert.match(xSource, /export const completeOAuthCallback = internalAction\(\{/);
  assert.match(xSource, /ctx\.runMutation\(\s*internal\.x\.consumeOAuthState/);
  assert.match(xSource, /https:\/\/api\.x\.com\/2\/oauth2\/token/);
  assert.match(xSource, /Authorization:\s*`Basic \$\{basicAuthCredentials\(\)\}`/);
  assert.match(xSource, /grant_type/);
  assert.match(xSource, /authorization_code/);
  assert.match(xSource, /code_verifier/);
  assert.match(xSource, /https:\/\/api\.x\.com\/2\/users\/me/);
  assert.match(xSource, /export const storeXTokens = internalMutation\(\{/);
  assert.match(xSource, /xAccessToken:\s*args\.accessToken/);
  assert.match(xSource, /xRefreshToken:\s*args\.refreshToken/);
  assert.doesNotMatch(xSource, /responseBody/);
  assert.doesNotMatch(xSource, /await response\.text\(\)/);
});

test("X OAuth state creation replaces prior user states before inserting", async () => {
  const source = await read("convex/x.ts");
  const storeStateSource = source.slice(
    source.indexOf("export const storeOAuthState"),
    source.indexOf("export const consumeOAuthState"),
  );
  const consumeStateSource = source.slice(
    source.indexOf("export const consumeOAuthState"),
    source.indexOf("export const storeXTokens"),
  );

  assert.match(storeStateSource, /withIndex\("by_userId"/);
  assert.match(storeStateSource, /q\.eq\("userId",\s*args\.userId\)/);
  assert.match(storeStateSource, /for \(const existingState of existingStates\)/);
  assert.match(storeStateSource, /ctx\.db\.delete\(existingState\._id\)/);
  assert.match(storeStateSource, /returnPath:\s*v\.string\(\)/);
  assert.match(storeStateSource, /returnPath:\s*args\.returnPath/);
  assert.match(storeStateSource, /ctx\.db\.insert\("xOAuthStates"/);
  assert.match(consumeStateSource, /returnPath:\s*v\.string\(\)/);
  assert.match(consumeStateSource, /returnPath:\s*existing\.returnPath \?\? DEFAULT_X_RETURN_PATH/);
});

test("X token refresh uses refresh_token grant and stores rotated tokens", async () => {
  const source = await read("convex/x.ts");
  const refreshSource = source.slice(
    source.indexOf("export const refreshUserToken"),
    source.indexOf("type XTokenResponse"),
  );

  assert.match(refreshSource, /export const refreshUserToken = internalAction\(\{/);
  assert.match(refreshSource, /grant_type/);
  assert.match(refreshSource, /refresh_token/);
  assert.match(source, /env\.X_CLIENT_ID/);
  assert.match(source, /env\.X_CLIENT_SECRET/);
  assert.match(source, /function basicAuthCredentials/);
  assert.match(source, /btoa\(`\$\{env\.X_CLIENT_ID\}:\$\{env\.X_CLIENT_SECRET\}`\)/);
  assert.match(refreshSource, /ctx\.runMutation\(internal\.x\.storeXTokens/);
  assert.match(refreshSource, /accessToken:\s*token\.access_token/);
  assert.match(refreshSource, /refreshToken:\s*token\.refresh_token/);
});

test("subscriber workspace exposes the X account connection flow", async () => {
  const source = await read("components/settings-workspace.tsx");

  assert.match(source, /api\.x\.connectionStatus/);
  assert.match(source, /api\.x\.startConnection/);
  assert.match(source, /Connect X account/);
  assert.match(source, /X account/);
  assert.match(source, /startConnection\(\{\s*returnPath:\s*"\/dashboard\/settings",?\s*\}\)/);
  assert.match(source, /window\.location\.assign\(connection\.url\)/);
  assert.doesNotMatch(source, /xAccessToken|xRefreshToken/);
});

test("X OAuth module exposes a disconnect mutation that clears stored tokens", async () => {
  const source = await read("convex/x.ts");
  const disconnectSource = source.slice(
    source.indexOf("export const disconnectX"),
    source.indexOf("export const postDraft"),
  );

  assert.match(source, /export const disconnectX = mutation\(\{/);
  assert.match(disconnectSource, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(disconnectSource, /by_clerkTokenIdentifier/);
  assert.match(disconnectSource, /xUserId:\s*undefined/);
  assert.match(disconnectSource, /xAccessToken:\s*undefined/);
  assert.match(disconnectSource, /xRefreshToken:\s*undefined/);
  assert.match(disconnectSource, /xTokenExpiresAt:\s*undefined/);
  assert.match(disconnectSource, /xConnectedAt:\s*undefined/);
  assert.match(disconnectSource, /xUsername:\s*undefined/);
  assert.match(disconnectSource, /disconnected:\s*v\.boolean\(\)/);
});

test("subscriber workspace can disconnect a connected X account", async () => {
  const source = await read("components/settings-workspace.tsx");
  const panelSource = source.slice(
    source.indexOf("export function XAccountPanel"),
    source.indexOf("function GitHubRepoPanel"),
  );

  assert.match(source, /api\.x\.disconnectX/);
  assert.match(panelSource, /useMutation\(api\.x\.disconnectX\)/);
  assert.match(panelSource, /isDisconnecting/);
  assert.match(panelSource, /Disconnecting\.\.\./);
  assert.match(panelSource, /Disconnect/);
});
