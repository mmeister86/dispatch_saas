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
    source.indexOf("function LandingSkeleton()"),
    source.indexOf("function GuardedApp()"),
  );
  let previousIndex = -1;

  assert.match(landingSkeleton, /className="landing-skeleton-light/);

  for (const block of expectedBlocks) {
    const renderIndex = landingSkeleton.indexOf(`<${block} />`);

    assert.notEqual(renderIndex, -1, `${block} should render without props`);
    assert.ok(renderIndex > previousIndex, `${block} should render in order`);
    previousIndex = renderIndex;
  }

  assert.doesNotMatch(landingSkeleton, /Contact14/);
});

test("landing skeleton keeps existing auth and billing entry points", async () => {
  const source = await read("app/page.tsx");

  assert.match(source, /Show/);
  assert.match(source, /signed-in/);
  assert.match(source, /signed-out/);
  assert.match(source, /SignInButton/);
  assert.match(source, /UserButton/);
  assert.match(source, /useAction\(api\.billing\.createCheckout\)/);
  assert.match(source, /handleCheckout\("good"\)/);
  assert.match(source, /handleCheckout\("better"\)/);
  assert.match(source, /href="\/dashboard"/);
  assert.match(source, /Open dashboard/);
});

test("landing skeleton does not inject Task-7 website copy yet", async () => {
  const source = await read("app/page.tsx");

  assert.doesNotMatch(source, /Turn commits into tweets/);
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
