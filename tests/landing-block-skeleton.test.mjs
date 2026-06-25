import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("signed-out home page renders installed landing blocks in Task-7 order", async () => {
  const source = await read("app/page.tsx");
  const expectedBlocks = [
    "Navbar11",
    "Hero233",
    "Feature276",
    "Pricing7",
    "Compare3",
    "Testimonial17",
    "Faq15",
    "Footer24",
  ];

  for (const block of expectedBlocks) {
    assert.match(source, new RegExp(`import \\{ ${block} \\}`));
  }

  const signedOutSection = source.slice(
    source.indexOf('<Show when="signed-out">'),
    source.indexOf('<Show when="signed-in">'),
  );
  assert.match(signedOutSection, /<LandingSkeleton \/>/);

  const landingSkeleton = source.slice(
    source.indexOf("function LandingSkeleton"),
    source.indexOf("function SignedInHome()"),
  );
  let previousIndex = -1;

  assert.match(landingSkeleton, /className="landing-skeleton-light/);

  for (const block of expectedBlocks) {
    const renderMatch = landingSkeleton.match(
      new RegExp(`<${block}(?:\\s+[^>]*)?\\s*/>`),
    );
    const renderIndex = renderMatch?.index ?? -1;

    assert.notEqual(renderIndex, -1, `${block} should render`);
    assert.ok(renderIndex > previousIndex, `${block} should render in order`);
    previousIndex = renderIndex;
  }

  assert.doesNotMatch(landingSkeleton, /Contact14/);
});

test("landing skeleton keeps existing auth and billing entry points", async () => {
  const source = await read("app/page.tsx");
  const heroSource = await read("components/hero233.tsx");

  assert.match(source, /Show/);
  assert.match(source, /signed-in/);
  assert.match(source, /signed-out/);
  assert.doesNotMatch(source, /<div className="sr-only">/);
  assert.match(heroSource, /SignInButton/);
  assert.doesNotMatch(source, /router\.replace\("\/dashboard"\)/);
  assert.match(source, /<LandingSkeleton dashboardHref="\/dashboard" \/>/);
  assert.match(source, /useAction\(api\.billing\.createCheckout\)/);
  assert.match(source, /handleCheckout\("good"\)/);
  assert.match(source, /handleCheckout\("better"\)/);
  assert.doesNotMatch(source, /Commit-to-post workspace/);
  assert.doesNotMatch(source, /Open dashboard/);
});

test("hero block uses the approved Dispatch headline, subhead, and single CTA", async () => {
  const source = await read("components/hero233.tsx");
  const ctaMatches = source.match(/Get your first draft/g) ?? [];

  assert.match(source, /Turn commits into tweets you.d actually post\./);
  assert.match(
    source,
    /Dispatch reads your latest GitHub commit, finds the build-in-public angle, and gives you 2.3 post-ready drafts in seconds\./,
  );
  assert.equal(ctaMatches.length, 1);
  assert.match(source, /<SignInButton mode="modal">/);
  assert.doesNotMatch(source, /Flexible Plan customized for you/);
  assert.doesNotMatch(source, /The only app you Need to Stay/);
  assert.doesNotMatch(source, /Productive/);
  assert.doesNotMatch(source, /Documentation/);
  assert.doesNotMatch(source, /Get Started/);
  assert.doesNotMatch(source, /Lorem ipsum/);
});

test("landing skeleton does not inject later Task-7 website copy yet", async () => {
  const source = await read("app/page.tsx");

  assert.doesNotMatch(source, /You keep shipping, but your audience/);
  assert.doesNotMatch(source, /Simple pricing for builders/);
  assert.doesNotMatch(source, /Dispatch is not just another ChatGPT wrapper/);
  assert.doesNotMatch(source, /Questions before your first draft/);
});

test("global container rule centers installed shadcnblocks", async () => {
  const source = await read("app/globals.css");

  assert.match(source, /\.container\s*\{/);
  assert.match(source, /margin-inline:\s*auto;/);
  assert.match(source, /padding-inline:\s*2rem;/);
});

test("landing skeleton isolates the default light shadcn theme", async () => {
  const source = await read("app/globals.css");

  assert.match(source, /\.landing-skeleton-light\s*\{/);
  assert.match(source, /--background:\s*oklch\(1 0 0\);/);
  assert.match(source, /--foreground:\s*oklch\(0\.145 0 0\);/);
});
