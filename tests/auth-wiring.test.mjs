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
  assert.match(source, /signInUrl="\/login"/);
  assert.match(source, /signUpUrl="\/sign-up"/);
  assert.match(source, /signInFallbackRedirectUrl="\/dashboard"/);
  assert.match(source, /signUpFallbackRedirectUrl="\/dashboard"/);
});

test("Convex client provider uses Clerk auth hook", async () => {
  const source = await read("components/convex-client-provider.tsx");

  assert.match(source, /ConvexProviderWithClerk/);
  assert.match(source, /useAuth/);
  assert.match(source, /NEXT_PUBLIC_CONVEX_URL/);
});

test("Home page exposes signed-in and signed-out auth states", async () => {
  const source = await read("app/page.tsx");
  const heroSource = await read("components/landing/commit-workbench-hero.tsx");

  assert.match(source, /Show/);
  assert.match(source, /signed-in/);
  assert.match(source, /signed-out/);
  assert.match(heroSource, /SignInButton/);
  assert.doesNotMatch(source, /useRouter/);
  assert.doesNotMatch(source, /router\.replace\("\/dashboard"\)/);
  assert.match(source, /api\.billing\.currentAccess/);
});

test("dashboard routes are protected by Clerk middleware before rendering the shell", async () => {
  assert.equal(await pathExists("middleware.ts"), true);

  const source = await read("middleware.ts");

  assert.match(source, /clerkMiddleware/);
  assert.match(source, /createRouteMatcher/);
  assert.match(source, /\["\/dashboard\(\.\*\)"\]/);
  assert.match(source, /redirectToSignIn\(\{\s*returnBackUrl:\s*req\.url\s*\}\)/);
  assert.match(source, /signInUrl:\s*"\/login"/);
  assert.match(source, /signUpUrl:\s*"\/sign-up"/);
  assert.match(source, /\/__clerk\/\(\.\*\)/);
});

test("dedicated Clerk login and sign-up pages are wired together", async () => {
  assert.equal(await pathExists("app/login/[[...login]]/page.tsx"), true);
  assert.equal(await pathExists("app/sign-up/[[...sign-up]]/page.tsx"), true);

  const loginSource = await read("app/login/[[...login]]/page.tsx");
  const signUpSource = await read("app/sign-up/[[...sign-up]]/page.tsx");

  assert.match(loginSource, /SignIn/);
  assert.match(loginSource, /routing="path"/);
  assert.match(loginSource, /path="\/login"/);
  assert.match(loginSource, /signUpUrl="\/sign-up"/);
  assert.match(loginSource, /fallbackRedirectUrl="\/dashboard"/);
  assert.match(loginSource, /Dispatch/);

  assert.match(signUpSource, /SignUp/);
  assert.match(signUpSource, /routing="path"/);
  assert.match(signUpSource, /path="\/sign-up"/);
  assert.match(signUpSource, /signInUrl="\/login"/);
  assert.match(signUpSource, /fallbackRedirectUrl="\/dashboard"/);
  assert.match(signUpSource, /Dispatch/);
});
