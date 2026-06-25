import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Convex auth config validates Clerk JWTs for Convex", async () => {
  const source = await read("convex/auth.config.ts");

  assert.match(source, /CLERK_JWT_ISSUER_DOMAIN/);
  assert.match(source, /applicationID:\s*["']convex["']/);
});

test("Convex viewer query derives identity server-side", async () => {
  const source = await read("convex/viewer.ts");

  assert.match(source, /ctx\.auth\.getUserIdentity\(\)/);
  assert.doesNotMatch(source, /userId/);
  assert.match(source, /tokenIdentifier/);
});

test("Next layout wraps Convex inside Clerk", async () => {
  const source = await read("app/layout.tsx");
  const clerkIndex = source.indexOf("<ClerkProvider");
  const convexIndex = source.indexOf("<ConvexClientProvider");

  assert.ok(clerkIndex >= 0, "layout should render ClerkProvider");
  assert.ok(convexIndex >= 0, "layout should render ConvexClientProvider");
  assert.ok(
    clerkIndex < convexIndex,
    "ClerkProvider must wrap ConvexClientProvider",
  );
});

test("Convex client provider uses Clerk auth hook", async () => {
  const source = await read("components/convex-client-provider.tsx");

  assert.match(source, /ConvexProviderWithClerk/);
  assert.match(source, /useAuth/);
  assert.match(source, /NEXT_PUBLIC_CONVEX_URL/);
});

test("Home page exposes signed-in and signed-out auth states", async () => {
  const source = await read("app/page.tsx");
  const heroSource = await read("components/hero233.tsx");

  assert.match(source, /Show/);
  assert.match(source, /signed-in/);
  assert.match(source, /signed-out/);
  assert.match(heroSource, /SignInButton/);
  assert.doesNotMatch(source, /useRouter/);
  assert.doesNotMatch(source, /router\.replace\("\/dashboard"\)/);
  assert.match(source, /api\.billing\.currentAccess/);
});
