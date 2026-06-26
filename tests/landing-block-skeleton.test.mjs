import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function assertInOrder(source, markers) {
  let previousIndex = -1;

  for (const marker of markers) {
    const index = source.indexOf(marker);
    assert.notEqual(index, -1, `${marker} should be present`);
    assert.ok(index > previousIndex, `${marker} should appear in order`);
    previousIndex = index;
  }
}

test("signed-out home page renders the Dispatch-owned landing page", async () => {
  const source = await read("app/page.tsx");
  const signedOutSection = source.slice(
    source.indexOf('<Show when="signed-out">'),
    source.indexOf('<Show when="signed-in">'),
  );
  const landingShell = source.slice(
    source.indexOf("function LandingSkeleton"),
    source.indexOf("function SignedInHome()"),
  );

  assert.match(source, /import \{ LandingPage \} from "@\/components\/landing\/landing-page";/);
  assert.match(signedOutSection, /<LandingSkeleton \/>/);
  assert.match(landingShell, /<LandingPage dashboardHref=\{dashboardHref\} \/>/);
  assert.doesNotMatch(source, /Hero233|Feature276|Pricing7|Compare3|Testimonial17|Faq15|Footer24|Navbar11/);
  assert.doesNotMatch(landingShell, /landing-skeleton-light/);
});

test("landing page composes Dispatch sections in the approved order", async () => {
  const source = await read("components/landing/landing-page.tsx");

  assertInOrder(source, [
    "<LandingNav",
    "<CommitWorkbenchHero",
    "<ProblemSection",
    "<CommitPipelineSection",
    "<PricingSection",
    "<WorkflowComparisonSection",
    "<ProofSection",
    "<FaqSection",
    "<LandingFooter",
  ]);

  for (const sectionId of [
    "home",
    "problem",
    "how-it-works",
    "pricing",
    "comparison",
    "proof",
    "faq",
  ]) {
    assert.match(source, new RegExp(`id="${sectionId}"|href: "#${sectionId}"`));
  }
});

test("commit workbench hero keeps approved copy and Clerk CTA behavior", async () => {
  const source = await read("components/landing/commit-workbench-hero.tsx");
  const ctaMatches = source.match(/Get your first draft/g) ?? [];

  assert.match(source, /Turn commits into tweets you(?:'|&apos;)d actually post\./);
  assert.match(
    source,
    /Dispatch reads your latest GitHub commit, finds the build-in-public angle, and gives you 2.3 post-ready drafts in seconds\./,
  );
  assert.match(source, /Commit Workbench/);
  assert.match(source, /feat: tighten onboarding flow/);
  assert.match(source, /2-3 post-ready drafts/);
  assert.equal(ctaMatches.length, 1);
  assert.match(source, /<SignInButton mode="modal">/);
  assert.match(source, /motion\/react/);
  assert.match(source, /useReducedMotion/);
  assert.doesNotMatch(source, /framer-motion/);
  assert.doesNotMatch(source, /Flexible Plan customized for you|The only app you Need to Stay|Productive|Get Started|Lorem ipsum/);
});

test("landing content uses approved Dispatch positioning and avoids generic block copy", async () => {
  const combinedSource = [
    await read("components/landing/landing-data.ts"),
    await read("components/landing/problem-section.tsx"),
    await read("components/landing/commit-pipeline-section.tsx"),
    await read("components/landing/pricing-section.tsx"),
    await read("components/landing/workflow-comparison-section.tsx"),
    await read("components/landing/proof-section.tsx"),
    await read("components/landing/faq-section.tsx"),
  ].join("\n");

  for (const expectedCopy of [
    "You keep shipping, but your audience never sees the progress.",
    "Every meaningful commit can build trust. Most of them stay buried in GitHub.",
    "Connect GitHub",
    "Push a commit",
    "Pick the draft worth posting",
    "Simple pricing for builders who keep shipping.",
    "Good",
    "Better",
    "€9/mo",
    "€19/mo",
    "ChatGPT + copy-paste",
    "Questions before your first draft?",
    "Does Dispatch post automatically?",
    "Is this just a ChatGPT wrapper?",
    "Do I need a content calendar?",
    "Is there a free plan?",
  ]) {
    assert.match(
      combinedSource,
      new RegExp(expectedCopy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }

  for (const genericCopy of [
    "Build faster with production ready features",
    "Every component is built with React",
    "Full Source Code",
    "Responsive Design",
    "For individuals getting started",
    "For professionals",
    "shadcnblocks.com",
    "Sarah Williams",
    "Head of Product",
    "Why should you adopt a pet",
    "Documentation",
    "Yearly",
  ]) {
    assert.doesNotMatch(combinedSource, new RegExp(genericCopy, "i"));
  }
});

test("landing pricing preserves signup entry points without billing calls", async () => {
  const navSource = await read("components/landing/landing-nav.tsx");
  const pricingSource = await read("components/landing/pricing-section.tsx");
  const dataSource = await read("components/landing/landing-data.ts");
  const combinedSource = `${navSource}\n${pricingSource}\n${dataSource}`;

  assert.match(combinedSource, /Good €9\/mo/);
  assert.match(combinedSource, /Better €19\/mo/);
  assert.match(navSource, /dashboardHref/);
  assert.match(navSource, /SignInButton/);
  assert.match(navSource, /aria-expanded=\{open\}/);
  assert.match(navSource, /aria-controls="landing-mobile-menu"/);
  assert.match(navSource, /id="landing-mobile-menu"/);
  assert.match(navSource, /\{open \? \(/);
  assert.match(pricingSource, /SignInButton/);
  assert.match(pricingSource, /Get your first draft/);
  assert.match(combinedSource, /1 repo/);
  assert.match(combinedSource, /20 published tweets \/ month/);
  assert.match(combinedSource, /100 drafts generated \/ month/);
  assert.match(combinedSource, /Up to 5 repos/);
  assert.match(combinedSource, /60 published tweets \/ month/);
  assert.match(combinedSource, /300 drafts generated \/ month/);
  assert.doesNotMatch(combinedSource, /api\.billing|createCheckout|checkout\.url|lemonsqueezy/i);
});

test("landing source uses motion/react and no framer-motion imports", async () => {
  const landingSources = [
    await read("components/landing/commit-workbench-hero.tsx"),
    await read("components/landing/landing-nav.tsx"),
    await read("components/landing/pricing-section.tsx"),
  ].join("\n");
  const packageSource = await read("package.json");

  assert.match(landingSources, /motion\/react/);
  assert.match(landingSources, /whileHover|whileTap|initial|animate/);
  assert.match(landingSources, /useReducedMotion/);
  assert.doesNotMatch(landingSources, /framer-motion/);
  assert.doesNotMatch(packageSource, /"framer-motion"/);
});

test("landing theme defines distinctive tokens without AI-gradient tells", async () => {
  const source = await read("app/globals.css");
  const layoutSource = await read("app/layout.tsx");
  const landingSource = await read("components/landing/landing-page.tsx");
  const rootTokens = source.slice(source.indexOf(":root {"), source.indexOf(".landing-page {"));
  const landingTokens = source.slice(source.indexOf(".landing-page {"), source.indexOf(".landing-page .container"));

  assert.match(layoutSource, /variable: "--font-display"/);
  assert.match(layoutSource, /variable: "--font-sans"/);
  assert.match(layoutSource, /variable: "--font-landing-sans"/);
  assert.match(landingSource, /className="landing-page/);
  assert.match(rootTokens, /--font-heading: var\(--font-sans\)/);
  assert.match(rootTokens, /--radius: 0\.625rem/);
  assert.match(landingTokens, /--font-sans: var\(--font-landing-sans\)/);
  assert.match(landingTokens, /--font-heading: var\(--font-display\)/);
  assert.match(landingTokens, /--dispatch-accent: oklch\(0\.58 0\.14 158\)/);
  assert.match(landingTokens, /--ease-dispatch:/);
  assert.match(landingTokens, /--space-section:/);
  assert.match(landingTokens, /--radius: 0\.375rem/);
  assert.match(landingTokens, /oklch/);
  assert.doesNotMatch(source, /background-clip:\s*text/);
  assert.doesNotMatch(source, /border-left:\s*[2-9]/);
  assert.doesNotMatch(source, /purple|violet|cyan-on-dark/i);
});
