import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("package installs the official Convex Resend component", async () => {
  const packageJson = JSON.parse(await read("package.json"));

  assert.equal(
    typeof packageJson.dependencies["@convex-dev/resend"],
    "string",
  );
});

test("Convex app registers the Resend component", async () => {
  const source = await read("convex/convex.config.ts");

  assert.match(source, /defineApp/);
  assert.match(source, /@convex-dev\/resend\/convex\.config\.js/);
  assert.match(source, /app\.use\(resend\)/);
});

test("Resend test sender stays internal and uses the component workpool", async () => {
  const source = await read("convex/email.ts");

  assert.match(source, /Resend/);
  assert.match(source, /components\.resend/);
  assert.match(source, /internalMutation/);
  assert.match(source, /sendTestEmail/);
  assert.match(source, /Dispatch <hello@usedispat\.ch>/);
  assert.match(source, /delivered@resend\.dev/);
  assert.match(source, /resend\.sendEmail\(ctx/);
  assert.doesNotMatch(source, /export const sendTestEmail = mutation/);
  assert.doesNotMatch(source, /export const sendTestEmail = action/);
});
