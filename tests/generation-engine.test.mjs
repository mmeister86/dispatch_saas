import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function generationCore() {
  return await import("../convex/generationCore.ts");
}

test("package installs the provider-swappable Vercel AI SDK stack", async () => {
  const packageJson = JSON.parse(await read("package.json"));

  for (const dependency of ["ai", "@ai-sdk/openai", "zod"]) {
    assert.equal(typeof packageJson.dependencies[dependency], "string");
  }
});

test("Convex app declares generation engine environment variables", async () => {
  const source = await read("convex/convex.config.ts");

  assert.match(source, /OPENAI_API_KEY:\s*v\.string\(\)/);
  assert.match(source, /AI_MODEL:\s*v\.string\(\)/);
});

test("Twitter Engager system prompt keeps only the relevant BIP writing rules", async () => {
  const { TWITTER_ENGAGER_SYSTEM_PROMPT } = await generationCore();

  for (const requiredPhrase of [
    /Twitter Engager/i,
    /authentic/i,
    /value-first/i,
    /hook/i,
    /thought leadership/i,
    /personal story/i,
    /indie builder/i,
    /actually post/i,
    /not a changelog/i,
  ]) {
    assert.match(TWITTER_ENGAGER_SYSTEM_PROMPT, requiredPhrase);
  }

  for (const excludedPhrase of [
    /DMs/i,
    /crisis/i,
    /advertising/i,
    /Twitter Spaces/i,
    /campaign analytics/i,
  ]) {
    assert.doesNotMatch(TWITTER_ENGAGER_SYSTEM_PROMPT, excludedPhrase);
  }
});

test("prompt assembly includes the commit message and the three expected angles", async () => {
  const { buildCommitVariantPrompt, TWITTER_ENGAGER_SYSTEM_PROMPT } =
    await generationCore();

  const prompt = buildCommitVariantPrompt({
    commitMessage:
      "feat: show expired X token state before users try to post a draft",
  });

  assert.equal(prompt.system, TWITTER_ENGAGER_SYSTEM_PROMPT);
  assert.match(prompt.prompt, /expired X token state/);
  assert.match(prompt.prompt, /what shipped/i);
  assert.match(prompt.prompt, /what I learned/i);
  assert.match(prompt.prompt, /behind the scenes/i);
  assert.match(prompt.prompt, /2-3/);
  assert.match(prompt.prompt, /JSON/i);
});

test("prompt assembly can include a confirmed voice profile without raw examples", async () => {
  const { buildCommitVariantPrompt } = await generationCore();

  const prompt = buildCommitVariantPrompt({
    commitMessage: "ship onboarding import for the latest connected repo commit",
    voiceProfile: {
      summary:
        "Direct, practical indie-builder notes with short context and a concrete lesson.",
      rules: [
        "Use first person when describing tradeoffs.",
        "Prefer specific product detail over broad inspiration.",
        "Avoid launch-hype language.",
      ],
    },
  });

  assert.match(prompt.prompt, /Confirmed writing style/i);
  assert.match(prompt.prompt, /Direct, practical indie-builder notes/i);
  assert.match(prompt.prompt, /Use first person/);
  assert.match(prompt.prompt, /Avoid launch-hype language/);
  assert.doesNotMatch(prompt.prompt, /raw examples|sample tweets|example posts/i);
});

test("prompt assembly deterministically bounds very large commit messages", async () => {
  const { buildCommitVariantPrompt, MAX_COMMIT_MESSAGE_LENGTH } =
    await generationCore();
  const visibleTail = "SHOULD_NOT_REACH_THE_MODEL";
  const prompt = buildCommitVariantPrompt({
    commitMessage: `${"x".repeat(MAX_COMMIT_MESSAGE_LENGTH)} ${visibleTail}`,
  });

  assert.doesNotMatch(prompt.prompt, new RegExp(visibleTail));
  assert.match(prompt.prompt, /truncated/i);
});

test("variant normalization trims, deduplicates, and keeps 2-3 valid variants", async () => {
  const { normalizeGeneratedVariants } = await generationCore();

  const variants = normalizeGeneratedVariants([
    "  I shipped the empty-state that catches an expired X token before the Post button wastes your click. Small guardrail, much calmer flow.  ",
    "I shipped the empty-state that catches an expired X token before the Post button wastes your click. Small guardrail, much calmer flow.",
    "Today I learned the best error state is the one that appears before someone has to retry a failed post.",
    "Behind the scenes: this was not a flashy commit, just the kind of edge case that makes a product feel less brittle.",
  ]);

  assert.deepEqual(variants, [
    "I shipped the empty-state that catches an expired X token before the Post button wastes your click. Small guardrail, much calmer flow.",
    "Today I learned the best error state is the one that appears before someone has to retry a failed post.",
    "Behind the scenes: this was not a flashy commit, just the kind of edge case that makes a product feel less brittle.",
  ]);
});

test("variant validation rejects changelog-speak, duplicates, and overlong output", async () => {
  const { MAX_TWEET_LENGTH, validateGeneratedVariants } =
    await generationCore();

  assert.throws(
    () =>
      validateGeneratedVariants([
        "Implemented expired token handling for X posting.",
        "Fixed webhook generation edge cases.",
      ]),
    /changelog-speak/i,
  );

  assert.throws(
    () =>
      validateGeneratedVariants([
        "I found the missing edge case: expired X tokens need a calm stop sign before posting.",
        "I found the missing edge case: expired X tokens need a calm stop sign before posting.",
      ]),
    /2-3 distinct/i,
  );

  assert.throws(
    () =>
      validateGeneratedVariants([
        "I shipped a safer posting path today.",
        "x".repeat(MAX_TWEET_LENGTH + 1),
      ]),
    /280 characters/i,
  );
});

test("variant validation accepts 2-3 distinct on-brand variants", async () => {
  const { validateGeneratedVariants } = await generationCore();

  assert.deepEqual(
    validateGeneratedVariants([
      "I shipped the tiny guardrail that stops expired X tokens before they turn into a failed post. Not flashy, but it makes the flow feel cared for.",
      "Today I learned that the best posting UX is sometimes just knowing when not to let someone click Post yet.",
      "Behind the scenes: this commit was all about turning a brittle API edge case into a calm next step.",
    ]),
    [
      "I shipped the tiny guardrail that stops expired X tokens before they turn into a failed post. Not flashy, but it makes the flow feel cared for.",
      "Today I learned that the best posting UX is sometimes just knowing when not to let someone click Post yet.",
      "Behind the scenes: this commit was all about turning a brittle API edge case into a calm next step.",
    ],
  );
});

test("generation action stays internal and never reads local agent files at runtime", async () => {
  const generationSource = await read("convex/generation.ts");
  const generationCoreSource = await read("convex/generationCore.ts");
  const runtimeSource = `${generationSource}\n${generationCoreSource}`;

  assert.match(generationSource, /internalAction\(/);
  assert.doesNotMatch(
    generationSource,
    /export const generateCommitVariants\s*=\s*action\(/,
  );
  assert.doesNotMatch(runtimeSource, /node:fs|from "fs"|from 'fs'|readFile/);
  assert.doesNotMatch(runtimeSource, /\.claude\/agents|marketing-twitter-engager/);
  assert.match(generationSource, /generateObject\(/);
  assert.match(generationSource, /createOpenAI\(/);
  assert.match(generationSource, /env\.OPENAI_API_KEY/);
  assert.match(generationSource, /env\.AI_MODEL/);
});

test("draft variant population stays internal and patches only generated variants", async () => {
  const generationSource = await read("convex/generation.ts");

  assert.match(generationSource, /import \{ internal \} from "\.\/_generated\/api"/);
  assert.match(generationSource, /export const populateDraftVariants = internalAction\(/);
  assert.match(generationSource, /draftId:\s*v\.id\("drafts"\)/);
  assert.match(generationSource, /commitMessage:\s*v\.string\(\)/);
  assert.match(generationSource, /generateVariantsForCommitMessage\(\{\s*commitMessage:\s*args\.commitMessage/s);
  assert.match(
    generationSource,
    /ctx\.runMutation\(internal\.generation\.updateDraftVariants/,
  );
  assert.match(generationSource, /export const updateDraftVariants = internalMutation\(/);
  assert.match(generationSource, /variants:\s*v\.array\(v\.string\(\)\)/);
  assert.match(generationSource, /ctx\.db\.patch\(args\.draftId,\s*\{\s*variants:\s*args\.variants,\s*\}\)/s);
  assert.doesNotMatch(generationSource, /updateDraftVariants[\s\S]*status:\s*"draft"/);
});

test("generation action accepts an optional confirmed voice profile", async () => {
  const generationSource = await read("convex/generation.ts");

  assert.match(generationSource, /voiceProfileValidator\s*=\s*v\.object\(\{/);
  assert.match(generationSource, /voiceProfile:\s*v\.optional\(voiceProfileValidator\)/);
  assert.match(generationSource, /summary:\s*v\.string\(\)/);
  assert.match(generationSource, /rules:\s*v\.array\(v\.string\(\)\)/);
  assert.match(generationSource, /voiceProfile:\s*args\.voiceProfile/);
  assert.doesNotMatch(generationSource, /rawTweets|tweetTexts|samples/);
});
