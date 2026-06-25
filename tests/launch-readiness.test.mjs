import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function fileExists(path) {
  await access(new URL(`../${path}`, import.meta.url));
}

test("landing footer is shareable and Dispatch-specific", async () => {
  const pageSource = await read("app/page.tsx");
  const footerSource = await read("components/footer24.tsx");

  assert.match(pageSource, /<Footer24 \/>/);
  assert.match(footerSource, /Dispatch/);
  assert.match(footerSource, /Built in public by @matthias_builds/);
  assert.match(footerSource, /https:\/\/x\.com\/matthias_builds/);
  assert.match(footerSource, /headingClassName/);
  assert.match(footerSource, /text-left/);
  assert.match(footerSource, /flex flex-wrap items-center gap-x-5 gap-y-3/);
  assert.doesNotMatch(footerSource, /lg:grid-cols-9/);
  for (const href of [
    "/",
    "#problem",
    "#how-it-works",
    "#pricing",
    "#comparison",
    "#proof",
    "#faq",
    "/impressum",
    "/datenschutz",
  ]) {
    assert.match(footerSource, new RegExp(`href: "${href}"`));
  }
  for (const label of [
    "Home",
    "Problem",
    "How it works",
    "Pricing",
    "Comparison",
    "Proof",
    "FAQ",
    "Legal notice",
    "Privacy policy",
  ]) {
    assert.match(footerSource, new RegExp(`label: "${label}"`));
  }
  assert.doesNotMatch(footerSource, /label: "Impressum"/);
  assert.doesNotMatch(footerSource, /label: "Datenschutz"/);
  assert.doesNotMatch(footerSource, /Shadcnblocks/);
  assert.doesNotMatch(footerSource, /example@shadcnblocks\.com/);
  assert.doesNotMatch(footerSource, /\(123\) 456 789/);
});

test("footer links point to landing page sections", async () => {
  const heroSource = await read("components/hero233.tsx");
  const featureSource = await read("components/feature276.tsx");
  const pricingSource = await read("components/pricing7.tsx");
  const comparisonSource = await read("components/compare3.tsx");
  const proofSource = await read("components/testimonial17.tsx");
  const faqSource = await read("components/faq15.tsx");

  assert.match(heroSource, /id="home"/);
  assert.match(featureSource, /id="problem"/);
  assert.match(featureSource, /id="how-it-works"/);
  assert.match(pricingSource, /id="pricing"/);
  assert.match(comparisonSource, /id="comparison"/);
  assert.match(proofSource, /id="proof"/);
  assert.match(faqSource, /id="faq"/);
});

test("navbar mirrors landing section links without legal footer links", async () => {
  const source = await read("components/navbar11.tsx");

  for (const href of [
    "/",
    "#problem",
    "#how-it-works",
    "#pricing",
    "#comparison",
    "#proof",
    "#faq",
  ]) {
    assert.match(source, new RegExp(`href: "${href}"`));
  }
  for (const label of [
    "Home",
    "Problem",
    "How it works",
    "Pricing",
    "Comparison",
    "Proof",
    "FAQ",
  ]) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }
  assert.doesNotMatch(source, /Legal notice/);
  assert.doesNotMatch(source, /Privacy policy/);
  assert.doesNotMatch(source, /\/impressum/);
  assert.doesNotMatch(source, /\/datenschutz/);
});

test("root metadata defines canonical and social preview cards", async () => {
  const source = await read("app/layout.tsx");

  assert.match(source, /metadataBase:\s*new URL\("https:\/\/usedispat\.ch"\)/);
  assert.match(source, /canonical:\s*"\/"/);
  assert.match(source, /openGraph:/);
  assert.match(source, /url:\s*"\/"/);
  assert.match(source, /siteName:\s*"Dispatch"/);
  assert.match(source, /images:/);
  assert.match(source, /url:\s*"\/og-dispatch\.png"/);
  assert.match(source, /twitter:/);
  assert.match(source, /card:\s*"summary_large_image"/);

  await fileExists("public/og-dispatch.svg");
  await fileExists("public/og-dispatch.png");
});
