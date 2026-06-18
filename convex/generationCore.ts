export const MAX_TWEET_LENGTH = 280;
export const MAX_COMMIT_MESSAGE_LENGTH = 1200;
const MIN_VARIANTS = 2;
const MAX_VARIANTS = 3;

const CHANGELOG_SPEAK_PATTERNS = [
  /^(chore|feat|fix|docs|style|refactor|test|tests|build|ci|perf|revert)(\(.+\))?!?:/i,
  /^(added|adds|implemented|implements|fixed|fixes|updated|updates|refactored|refactors|changed|changes|created|creates|removed|removes|improved|improves)\b/i,
];

export const TWITTER_ENGAGER_SYSTEM_PROMPT = [
  "You are Dispatch's Twitter Engager for indie builders.",
  "Write authentic, value-first Twitter/X drafts that feel like real conversation, not broadcast content.",
  "Lead with a hook and turn a commit into thought leadership, a personal story, or a behind-the-scenes learning.",
  "The reader should feel the founder's visible progress; this is not a changelog.",
  "Each variant must sound like something an indie builder would actually post under their own name.",
  "Avoid corporate marketing voice, generic AI-social-media phrasing, and implementation-only summaries.",
  "Do not write threads, hashtags, CTAs, release notes, or commit messages.",
].join("\n");

export type CommitVariantPrompt = {
  system: string;
  prompt: string;
};

export function buildCommitVariantPrompt({
  commitMessage,
}: {
  commitMessage: string;
}): CommitVariantPrompt {
  const normalizedCommitMessage = commitMessage.trim();

  if (normalizedCommitMessage.length === 0) {
    throw new Error("Commit message is required.");
  }

  const boundedCommitMessage =
    normalizedCommitMessage.length > MAX_COMMIT_MESSAGE_LENGTH
      ? `${normalizedCommitMessage.slice(0, MAX_COMMIT_MESSAGE_LENGTH)}\n[Commit message truncated for generation.]`
      : normalizedCommitMessage;

  return {
    system: TWITTER_ENGAGER_SYSTEM_PROMPT,
    prompt: [
      "Generate 2-3 Twitter/X variants from this Git commit message.",
      "",
      "Commit message:",
      boundedCommitMessage,
      "",
      "Return JSON with a variants array only.",
      "Each variant must be under 280 characters.",
      "Make the variants distinct and cover these angles when possible:",
      "- what shipped",
      "- what I learned",
      "- behind the scenes",
      "",
      "Do not start with changelog-speak like added, implemented, fixed, updated, feat:, fix:, or chore:.",
    ].join("\n"),
  };
}

export function normalizeGeneratedVariants(variants: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const variant of variants) {
    const trimmed = variant.trim().replace(/\s+/g, " ");
    const key = trimmed.toLowerCase();

    if (trimmed.length === 0 || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized.slice(0, MAX_VARIANTS);
}

export function validateGeneratedVariants(variants: string[]): string[] {
  const normalized = normalizeGeneratedVariants(variants);

  if (
    normalized.length < MIN_VARIANTS ||
    normalized.length > MAX_VARIANTS ||
    normalized.length !== variants.length
  ) {
    throw new Error("Generation must return 2-3 distinct variants.");
  }

  for (const variant of normalized) {
    if (variant.length > MAX_TWEET_LENGTH) {
      throw new Error("Each generated variant must be 280 characters or fewer.");
    }

    if (isChangelogSpeakVariant(variant)) {
      throw new Error("Generated variants must avoid changelog-speak.");
    }
  }

  return normalized;
}

export function isChangelogSpeakVariant(variant: string): boolean {
  const trimmed = variant.trim();

  return CHANGELOG_SPEAK_PATTERNS.some((pattern) => pattern.test(trimmed));
}
