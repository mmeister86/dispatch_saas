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

test("feature block uses the approved empathy and how-it-works copy", async () => {
  const source = await read("components/feature276.tsx");
  const expectedSteps = [
    "Connect GitHub",
    "Push a commit",
    "Pick the draft worth posting",
  ];

  assert.match(
    source,
    /You keep shipping, but your audience never sees the progress\./,
  );
  assert.match(
    source,
    /Every meaningful commit can build trust\. Most of them stay buried in GitHub\./,
  );
  assert.match(source, /How it works/);

  for (const step of expectedSteps) {
    const matches = source.match(new RegExp(step, "g")) ?? [];
    assert.equal(matches.length, 1, `${step} should appear exactly once`);
  }

  assert.doesNotMatch(source, /Build faster with production ready features/);
  assert.doesNotMatch(source, /Every component is built with React/);
  assert.doesNotMatch(source, /Full Source Code/);
  assert.doesNotMatch(source, /Responsive Design/);
});

test("pricing block and header use the approved Good and Better offer", async () => {
  const pageSource = await read("app/page.tsx");
  const navbarSource = await read("components/navbar11.tsx");
  const pricingSource = await read("components/pricing7.tsx");
  const landingSkeleton = pageSource.slice(
    pageSource.indexOf("function LandingSkeleton"),
    pageSource.indexOf("function SignedInHome()"),
  );

  assert.ok(
    landingSkeleton.indexOf("<Navbar11") < landingSkeleton.indexOf("<Pricing7"),
    "navbar should render before pricing",
  );

  assert.match(navbarSource, /Dispatch/);
  assert.match(navbarSource, /Good €9\/mo/);
  assert.match(navbarSource, /Better €19\/mo/);
  assert.match(navbarSource, /SignInButton/);
  assert.doesNotMatch(navbarSource, /api\.billing/);
  assert.doesNotMatch(navbarSource, /createCheckout/);
  assert.doesNotMatch(navbarSource, /checkout\.url/);

  assert.match(
    pricingSource,
    /Simple pricing for builders who keep shipping\./,
  );
  assert.match(pricingSource, /Good/);
  assert.match(pricingSource, /€9\/mo/);
  assert.match(pricingSource, /1 repo/);
  assert.match(pricingSource, /20 published tweets \/ month/);
  assert.match(pricingSource, /100 drafts generated \/ month/);
  assert.match(pricingSource, /Better/);
  assert.match(pricingSource, /Best for consistent builders/);
  assert.match(pricingSource, /€19\/mo/);
  assert.match(pricingSource, /Up to 5 repos/);
  assert.match(pricingSource, /60 published tweets \/ month/);
  assert.match(pricingSource, /300 drafts generated \/ month/);
  assert.match(pricingSource, /Get your first draft/);
  assert.match(pricingSource, /SignInButton/);
  assert.doesNotMatch(pricingSource, /api\.billing/);
  assert.doesNotMatch(pricingSource, /createCheckout/);
  assert.doesNotMatch(pricingSource, /checkout\.url/);
  assert.doesNotMatch(pricingSource, /lemonsqueezy/i);

  assert.doesNotMatch(pricingSource, /name:\s*"Free"/);
  assert.doesNotMatch(pricingSource, /name:\s*"Pro"/);
  assert.doesNotMatch(pricingSource, /\$0/);
  assert.doesNotMatch(pricingSource, /\$49/);
  assert.doesNotMatch(pricingSource, /shadcnblocks\.com/);
  assert.doesNotMatch(pricingSource, /For individuals getting started/);
  assert.doesNotMatch(pricingSource, /For professionals/);
  assert.doesNotMatch(pricingSource, /Yearly/);
});

test("comparison block uses the PRD ChatGPT copy-paste rows", async () => {
  const source = await read("components/compare3.tsx");
  const expectedRows = [
    "Pulls your commits automatically",
    "Knows your build context",
    "Build-in-public voice by default",
    "One-click post to X",
    "Time per tweet",
    "Survives past week 1",
  ];
  const placeholderRows = [
    "Acme",
    "Biz",
    "Team Overview",
    "Custom Branding",
    "API Access",
    "Advanced Analytics",
    "Customer Support",
    "shadcnblocks.com",
  ];

  assert.match(source, /ChatGPT \+ copy-paste/);
  assert.match(source, /Dispatch/);

  for (const row of expectedRows) {
    assert.match(source, new RegExp(row));
  }

  assert.match(source, /~10 min/);
  assert.match(source, /~20 sec/);
  assert.match(source, /rarely/);

  for (const placeholder of placeholderRows) {
    assert.doesNotMatch(source, new RegExp(placeholder));
  }
});

test("landing skeleton keeps Task-25 demo and later website copy out of scope", async () => {
  const pageSource = await read("app/page.tsx");
  const featureSource = await read("components/feature276.tsx");
  const combinedSource = `${pageSource}\n${featureSource}`;

  assert.doesNotMatch(combinedSource, /sample commits/i);
  assert.doesNotMatch(combinedSource, /canned/i);
  assert.doesNotMatch(combinedSource, /visitor clicks/i);
  assert.doesNotMatch(combinedSource, /Simple pricing for builders/);
  assert.doesNotMatch(combinedSource, /Dispatch is not just another ChatGPT wrapper/);
  assert.doesNotMatch(combinedSource, /Questions before your first draft/);
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
