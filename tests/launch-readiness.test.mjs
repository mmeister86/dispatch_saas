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
  const footerSource = await read("components/landing/landing-footer.tsx");
  const dataSource = await read("components/landing/landing-data.ts");
  const combinedSource = `${footerSource}\n${dataSource}`;

  assert.match(pageSource, /<LandingPage/);
  assert.match(footerSource, /Dispatch/);
  assert.match(footerSource, /Built in public by @matthias_builds/);
  assert.match(footerSource, /https:\/\/x\.com\/matthias_builds/);
  assert.match(footerSource, /Turn meaningful commits into posts worth sharing\./);

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
    assert.match(combinedSource, new RegExp(`href: "${href}"`));
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
    assert.match(combinedSource, new RegExp(`label: "${label}"`));
  }

  assert.doesNotMatch(footerSource, /label: "Impressum"/);
  assert.doesNotMatch(footerSource, /label: "Datenschutz"/);
  assert.doesNotMatch(footerSource, /Shadcnblocks|example@shadcnblocks\.com|\(123\) 456 789/);
});

test("footer and navbar links point to landing page sections", async () => {
  const landingSource = await read("components/landing/landing-page.tsx");
  const navSource = await read("components/landing/landing-nav.tsx");
  const footerSource = await read("components/landing/landing-footer.tsx");
  const dataSource = await read("components/landing/landing-data.ts");
  const combinedSource = `${navSource}\n${footerSource}\n${dataSource}`;

  for (const id of [
    "home",
    "problem",
    "how-it-works",
    "pricing",
    "comparison",
    "proof",
    "faq",
  ]) {
    assert.match(landingSource, new RegExp(`id="${id}"`));
  }

  for (const href of [
    "/",
    "#problem",
    "#how-it-works",
    "#pricing",
    "#comparison",
    "#proof",
    "#faq",
  ]) {
    assert.match(combinedSource, new RegExp(`href: "${href}"`));
  }

  assert.doesNotMatch(navSource, /Legal notice|Privacy policy|\/impressum|\/datenschutz/);
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
  assert.match(source, /Archivo/);
  assert.match(source, /Commissioner/);

  await fileExists("public/og-dispatch.svg");
  await fileExists("public/og-dispatch.png");
});
