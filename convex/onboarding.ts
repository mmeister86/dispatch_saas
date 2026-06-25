import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { createInstallationAccessToken } from "./github";
import { rateLimiter } from "./rateLimits";
import {
  action,
  env,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const X_RECENT_POSTS_LIMIT = 20;
const RECENT_COMMITS_IMPORT_LIMIT = 5;
const MIN_MANUAL_POSTS = 3;
const MAX_MANUAL_POSTS = 5;
const MAX_STYLE_INPUT_LENGTH = 4000;
const MIN_PROFILE_SUMMARY_LENGTH = 20;
const MAX_PROFILE_SUMMARY_LENGTH = 600;
const MAX_PROFILE_RULES = 6;
const MAX_PROFILE_RULE_LENGTH = 180;

const voiceProfileSchema = z.object({
  summary: z
    .string()
    .min(MIN_PROFILE_SUMMARY_LENGTH)
    .max(MAX_PROFILE_SUMMARY_LENGTH),
  rules: z.array(z.string()).min(3).max(MAX_PROFILE_RULES),
});

const voiceProfileViewValidator = v.object({
  summary: v.string(),
  rules: v.array(v.string()),
  source: v.union(v.literal("x_import"), v.literal("manual_paste")),
  sampleCount: v.number(),
  confirmedAt: v.union(v.number(), v.null()),
  updatedAt: v.number(),
});

type VoiceProfileSource = "x_import" | "manual_paste";
type VoiceProfileView = {
  summary: string;
  rules: string[];
  source: VoiceProfileSource;
  sampleCount: number;
  confirmedAt: number | null;
  updatedAt: number;
};

type OnboardingUser = {
  _id: Id<"users">;
  xUserId?: string;
  xAccessToken?: string;
  xRefreshToken?: string;
  xTokenExpiresAt?: number;
};

type RecentCommit = {
  sha: string;
  message: string;
};

export const status = query({
  args: {},
  returns: v.union(
    v.object({ state: v.literal("signedOut") }),
    v.object({ state: v.literal("needsSubscription") }),
    v.object({
      state: v.literal("onboarding"),
      completed: v.boolean(),
      voiceProfile: v.union(voiceProfileViewValidator, v.null()),
      firstDraft: v.union(
        v.object({
          _id: v.id("drafts"),
          repoFullName: v.string(),
          commitSha: v.string(),
          commitMessage: v.string(),
          variants: v.array(v.string()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return { state: "signedOut" as const };
    }

    const user = await userByTokenIdentifier(ctx, identity.tokenIdentifier);

    if (user === null || !(await hasActiveSubscription(ctx, user._id))) {
      return { state: "needsSubscription" as const };
    }

    const voiceProfile = await voiceProfileForUser(ctx, user._id);
    const firstDraft = await firstVisibleDraftForUser(ctx, user._id);
    const completed = Boolean(voiceProfile?.confirmedAt && firstDraft);

    return {
      state: "onboarding" as const,
      completed,
      voiceProfile: voiceProfile ? profileToView(voiceProfile) : null,
      firstDraft,
    };
  },
});

export const calibrateFromX = action({
  args: {},
  returns: voiceProfileViewValidator,
  handler: async (ctx): Promise<VoiceProfileView> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before calibrating your voice.");
    }

    let user: OnboardingUser = await ctx.runQuery(
      internal.onboarding.subscribedUserByToken,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
      },
    );

    if (
      !user.xUserId ||
      !user.xAccessToken ||
      !user.xRefreshToken ||
      !user.xTokenExpiresAt
    ) {
      throw new Error("Connect X before importing your recent posts.");
    }

    if (user.xTokenExpiresAt <= Date.now()) {
      await ctx.runAction(internal.x.refreshUserToken, { userId: user._id });
      user = await ctx.runQuery(internal.onboarding.subscribedUserByToken, {
        clerkTokenIdentifier: identity.tokenIdentifier,
      });
    }

    if (!user.xUserId || !user.xAccessToken) {
      throw new Error("Reconnect X before importing your recent posts.");
    }

    const recentPosts = await fetchRecentOwnXPosts({
      xUserId: user.xUserId,
      accessToken: user.xAccessToken,
    });

    if (recentPosts.length < MIN_MANUAL_POSTS) {
      throw new Error("Not enough recent X posts. Paste 3-5 posts instead.");
    }

    const profile = await generateVoiceProfile({
      posts: recentPosts,
      source: "x_import",
    });

    await ctx.runMutation(internal.onboarding.storeVoiceProfileDraft, {
      userId: user._id,
      ...profile,
    });

    return {
      ...profile,
      confirmedAt: null,
      updatedAt: profile.updatedAt,
    };
  },
});

export const calibrateFromPosts = action({
  args: {
    posts: v.array(v.string()),
  },
  returns: voiceProfileViewValidator,
  handler: async (ctx, args): Promise<VoiceProfileView> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before calibrating your voice.");
    }

    const user: OnboardingUser = await ctx.runQuery(
      internal.onboarding.subscribedUserByToken,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
      },
    );
    const posts = normalizePosts(args.posts);

    if (posts.length < MIN_MANUAL_POSTS || posts.length > MAX_MANUAL_POSTS) {
      throw new Error("Paste 3-5 posts to calibrate your writing style.");
    }

    const profile = await generateVoiceProfile({
      posts,
      source: "manual_paste",
    });

    await ctx.runMutation(internal.onboarding.storeVoiceProfileDraft, {
      userId: user._id,
      ...profile,
    });

    return {
      ...profile,
      confirmedAt: null,
      updatedAt: profile.updatedAt,
    };
  },
});

export const updateVoiceProfileDraft = mutation({
  args: {
    summary: v.string(),
    rules: v.array(v.string()),
  },
  returns: voiceProfileViewValidator,
  handler: async (ctx, args): Promise<VoiceProfileView> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before editing your voice profile.");
    }

    const user = await requireSubscribedUser(ctx, identity.tokenIdentifier);
    const profile = await voiceProfileForUser(ctx, user._id);

    if (profile === null) {
      throw new Error("Calibrate your voice before editing it.");
    }

    const summary = normalizeProfileSummary(args.summary);
    const rules = normalizeRules(args.rules);

    if (rules.length === 0) {
      throw new Error("Add at least one voice rule.");
    }

    const updatedAt = Date.now();

    await ctx.db.patch(profile._id, {
      summary,
      rules,
      confirmedAt: undefined,
      updatedAt,
    });

    return profileToView({
      ...profile,
      summary,
      rules,
      confirmedAt: undefined,
      updatedAt,
    });
  },
});

export const rejectVoiceProfile = mutation({
  args: {},
  returns: v.object({
    rejected: v.boolean(),
  }),
  handler: async (ctx): Promise<{ rejected: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before rejecting your voice profile.");
    }

    const user = await requireSubscribedUser(ctx, identity.tokenIdentifier);
    const profile = await voiceProfileForUser(ctx, user._id);

    if (profile === null) {
      return { rejected: false };
    }

    await ctx.db.delete(profile._id);

    return { rejected: true };
  },
});

export const confirmVoiceProfile = mutation({
  args: {},
  returns: voiceProfileViewValidator,
  handler: async (ctx): Promise<VoiceProfileView> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before confirming your voice profile.");
    }

    const user = await requireSubscribedUser(ctx, identity.tokenIdentifier);
    const profile = await voiceProfileForUser(ctx, user._id);

    if (profile === null) {
      throw new Error("Calibrate your voice before confirming it.");
    }

    const confirmedAt = profile.confirmedAt ?? Date.now();

    await ctx.db.patch(profile._id, { confirmedAt });

    return profileToView({ ...profile, confirmedAt });
  },
});

export const importRecentCommitDrafts = action({
  args: {
    githubRepoId: v.string(),
  },
  returns: v.object({
    drafts: v.array(
      v.object({
        draftId: v.id("drafts"),
        commitSha: v.string(),
        commitMessage: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before importing a commit.");
    }

    const context: ImportDraftContext = await ctx.runQuery(
      internal.onboarding.importDraftContext,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
        githubRepoId: args.githubRepoId,
      },
    );

    if (!context.voiceProfile.confirmedAt) {
      throw new Error("Confirm your voice profile before creating a draft.");
    }

    const generationLimit = await rateLimiter.limit(ctx, "generateDraftVariants", {
      key: context.userId,
    });

    if (!generationLimit.ok) {
      throw new Error("Draft generation is busy. Try again in a minute.");
    }

    const recentCommits = await fetchRecentCommits({
      fullName: context.repo.fullName,
      githubInstallationId: context.repo.githubInstallationId,
    });
    const drafts: Array<{
      draftId: Id<"drafts">;
      commitSha: string;
      commitMessage: string;
    }> = [];

    for (const commit of recentCommits) {
      const variants: string[] = await ctx.runAction(
        internal.generation.generateCommitVariants,
        {
          commitMessage: commit.message,
          voiceProfile: {
            summary: context.voiceProfile.summary,
            rules: context.voiceProfile.rules,
          },
        },
      );
      const draftId: Id<"drafts"> = await ctx.runMutation(
        internal.onboarding.upsertOnboardingDraft,
        {
          userId: context.userId,
          repoId: context.repo._id,
          commitSha: commit.sha,
          commitMessage: commit.message,
          variants,
        },
      );

      drafts.push({
        draftId,
        commitSha: commit.sha,
        commitMessage: commit.message,
      });
    }

    return { drafts };
  },
});

export const subscribedUserByToken = internalQuery({
  args: {
    clerkTokenIdentifier: v.string(),
  },
  returns: v.object({
    _id: v.id("users"),
    xUserId: v.optional(v.string()),
    xAccessToken: v.optional(v.string()),
    xRefreshToken: v.optional(v.string()),
    xTokenExpiresAt: v.optional(v.number()),
  }),
  handler: async (ctx, args): Promise<OnboardingUser> => {
    const user = await requireSubscribedUser(ctx, args.clerkTokenIdentifier);

    return {
      _id: user._id,
      ...(user.xUserId ? { xUserId: user.xUserId } : {}),
      ...(user.xAccessToken ? { xAccessToken: user.xAccessToken } : {}),
      ...(user.xRefreshToken ? { xRefreshToken: user.xRefreshToken } : {}),
      ...(user.xTokenExpiresAt ? { xTokenExpiresAt: user.xTokenExpiresAt } : {}),
    };
  },
});

export const importDraftContext = internalQuery({
  args: {
    clerkTokenIdentifier: v.string(),
    githubRepoId: v.string(),
  },
  returns: v.object({
    userId: v.id("users"),
    repo: v.object({
      _id: v.id("repos"),
      fullName: v.string(),
      githubInstallationId: v.string(),
    }),
    voiceProfile: v.object({
      summary: v.string(),
      rules: v.array(v.string()),
      confirmedAt: v.optional(v.number()),
    }),
  }),
  handler: async (ctx, args): Promise<ImportDraftContext> => {
    const user = await requireSubscribedUser(ctx, args.clerkTokenIdentifier);
    const voiceProfile = await voiceProfileForUser(ctx, user._id);

    if (voiceProfile === null) {
      throw new Error("Calibrate your voice before creating a draft.");
    }

    const repo = await ctx.db
      .query("repos")
      .withIndex("by_userId_and_githubRepoId", (q) =>
        q.eq("userId", user._id).eq("githubRepoId", args.githubRepoId),
      )
      .unique();

    if (repo === null) {
      throw new Error("Choose a connected GitHub repository first.");
    }

    return {
      userId: user._id,
      repo: {
        _id: repo._id,
        fullName: repo.fullName,
        githubInstallationId: repo.githubInstallationId,
      },
      voiceProfile: {
        summary: voiceProfile.summary,
        rules: voiceProfile.rules,
        ...(voiceProfile.confirmedAt
          ? { confirmedAt: voiceProfile.confirmedAt }
          : {}),
      },
    };
  },
});

export const storeVoiceProfileDraft = internalMutation({
  args: {
    userId: v.id("users"),
    summary: v.string(),
    rules: v.array(v.string()),
    source: v.union(v.literal("x_import"), v.literal("manual_paste")),
    sampleCount: v.number(),
    updatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("voiceProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(1);

    const profile = {
      userId: args.userId,
      summary: args.summary,
      rules: args.rules,
      source: args.source,
      sampleCount: args.sampleCount,
      confirmedAt: undefined,
      updatedAt: args.updatedAt,
    };

    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, profile);
      return null;
    }

    await ctx.db.insert("voiceProfiles", profile);

    return null;
  },
});

export const upsertOnboardingDraft = internalMutation({
  args: {
    userId: v.id("users"),
    repoId: v.id("repos"),
    commitSha: v.string(),
    commitMessage: v.string(),
    variants: v.array(v.string()),
  },
  returns: v.id("drafts"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("drafts")
      .withIndex("by_repoId_and_commitSha", (q) =>
        q.eq("repoId", args.repoId).eq("commitSha", args.commitSha),
      )
      .take(1);

    if (existing[0]) {
      if (existing[0].userId !== args.userId) {
        throw new Error("Draft not found.");
      }

      if (existing[0].status === "draft") {
        await ctx.db.patch(existing[0]._id, {
          commitMessage: args.commitMessage,
          variants: args.variants,
        });
      }

      return existing[0]._id;
    }

    return await ctx.db.insert("drafts", {
      userId: args.userId,
      repoId: args.repoId,
      commitSha: args.commitSha,
      commitMessage: args.commitMessage,
      variants: args.variants,
      status: "draft",
    });
  },
});

async function generateVoiceProfile({
  posts,
  source,
}: {
  posts: string[];
  source: VoiceProfileSource;
}) {
  const generationLimitKey = source === "x_import" ? "x-import" : "manual";
  const boundedPosts = boundStyleInput(posts);
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  const result = await generateObject({
    model: openai(env.AI_MODEL),
    schema: voiceProfileSchema,
    system: [
      "You distill a founder's X/Twitter writing style for Dispatch.",
      "Return only derived guidance, never quote or preserve the source posts.",
      "Keep the style practical enough to guide future commit-to-post drafts.",
    ].join("\n"),
    prompt: [
      `Source: ${generationLimitKey}`,
      "Infer a compact writing style profile from these posts.",
      "Write a 1-2 sentence summary and 3-6 concrete rules.",
      "Do not include raw post text, handles, URLs, or copied phrases.",
      "",
      boundedPosts,
    ].join("\n"),
  });
  const summary = result.object.summary.trim();
  const rules = normalizeRules(result.object.rules);

  if (summary.length === 0 || rules.length < 3) {
    throw new Error("Voice calibration did not produce enough guidance.");
  }

  return {
    summary: summary.slice(0, MAX_PROFILE_SUMMARY_LENGTH),
    rules,
    source,
    sampleCount: posts.length,
    updatedAt: Date.now(),
  };
}

async function fetchRecentOwnXPosts({
  xUserId,
  accessToken,
}: {
  xUserId: string;
  accessToken: string;
}) {
  const url = new URL(`https://api.x.com/2/users/${xUserId}/tweets`);
  url.searchParams.set("max_results", String(X_RECENT_POSTS_LIMIT));
  url.searchParams.set("tweet.fields", "created_at");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("X import failed. Paste 3-5 posts instead.");
  }

  const payload = (await response.json()) as {
    data?: Array<{ text?: string }>;
  };

  return normalizePosts((payload.data ?? []).map((post) => post.text ?? ""));
}

async function fetchRecentCommits({
  fullName,
  githubInstallationId,
}: {
  fullName: string;
  githubInstallationId: string;
}): Promise<RecentCommit[]> {
  const [owner, repoName] = parseRepoFullName(fullName);
  const token = await createInstallationAccessToken(githubInstallationId);
  const url = new URL(
    `https://api.github.com/repos/${owner}/${repoName}/commits`,
  );
  url.searchParams.set("per_page", String(RECENT_COMMITS_IMPORT_LIMIT));
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error("Could not import recent GitHub commits.");
  }

  const payload = (await response.json()) as Array<{
    sha?: string;
    commit?: { message?: string };
  }>;
  const commits = payload
    .map((commit) => ({
      sha: commit.sha ?? "",
      message: commit.commit?.message ?? "",
    }))
    .filter((commit) => commit.sha.length > 0 && commit.message.length > 0)
    .slice(0, RECENT_COMMITS_IMPORT_LIMIT);

  if (commits.length === 0) {
    throw new Error("That repository does not have a commit to import.");
  }

  return commits;
}

async function requireSubscribedUser(
  ctx: QueryCtx | MutationCtx,
  clerkTokenIdentifier: string,
) {
  const user = await userByTokenIdentifier(ctx, clerkTokenIdentifier);

  if (user === null || !(await hasActiveSubscription(ctx, user._id))) {
    throw new Error("Subscribe before onboarding Dispatch.");
  }

  return user;
}

async function userByTokenIdentifier(
  ctx: QueryCtx | MutationCtx,
  clerkTokenIdentifier: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkTokenIdentifier", (q) =>
      q.eq("clerkTokenIdentifier", clerkTokenIdentifier),
    )
    .unique();
}

async function hasActiveSubscription(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
) {
  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId_and_status_and_currentPeriodEnd", (q) =>
      q
        .eq("userId", userId)
        .eq("status", "active")
        .gt("currentPeriodEnd", Date.now()),
    )
    .take(1);

  return subscriptions.length > 0;
}

async function voiceProfileForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
) {
  const profiles = await ctx.db
    .query("voiceProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(1);

  return profiles[0] ?? null;
}

async function firstVisibleDraftForUser(ctx: QueryCtx, userId: Id<"users">) {
  const drafts = await ctx.db
    .query("drafts")
    .withIndex("by_userId_and_status", (q) =>
      q.eq("userId", userId).eq("status", "draft"),
    )
    .order("desc")
    .take(20);
  const draft = drafts.find((candidate) => candidate.variants.length > 0);

  if (!draft) {
    return null;
  }

  const repo = await ctx.db.get(draft.repoId);

  return {
    _id: draft._id,
    repoFullName: repo?.fullName ?? "Unknown repository",
    commitSha: draft.commitSha,
    commitMessage: draft.commitMessage,
    variants: draft.variants,
  };
}

function normalizePosts(posts: string[]) {
  return posts
    .map((post) => post.trim().replace(/\s+/g, " "))
    .filter((post) => post.length > 0);
}

function normalizeProfileSummary(summary: string) {
  const normalized = summary.trim().replace(/\s+/g, " ");

  if (normalized.length < MIN_PROFILE_SUMMARY_LENGTH) {
    throw new Error("Voice profile summary is too short.");
  }

  return normalized.slice(0, MAX_PROFILE_SUMMARY_LENGTH);
}

function normalizeRules(rules: string[]) {
  return rules
    .map((rule) => rule.trim().replace(/\s+/g, " "))
    .filter((rule) => rule.length > 0)
    .slice(0, MAX_PROFILE_RULES)
    .map((rule) => rule.slice(0, MAX_PROFILE_RULE_LENGTH));
}

function boundStyleInput(posts: string[]) {
  let output = "";

  for (const post of posts) {
    const next = `${output.length === 0 ? "" : "\n\n"}- ${post}`;

    if (output.length + next.length > MAX_STYLE_INPUT_LENGTH) {
      break;
    }

    output += next;
  }

  return output;
}

function profileToView(profile: Doc<"voiceProfiles">): VoiceProfileView {
  return {
    summary: profile.summary,
    rules: profile.rules,
    source: profile.source,
    sampleCount: profile.sampleCount,
    confirmedAt: profile.confirmedAt ?? null,
    updatedAt: profile.updatedAt,
  };
}

function parseRepoFullName(fullName: string) {
  const [owner, repoName] = fullName.split("/");

  if (!owner || !repoName) {
    throw new Error("Connected repository is missing its owner or name.");
  }

  return [owner, repoName] as const;
}

type ImportDraftContext = {
  userId: Id<"users">;
  repo: {
    _id: Id<"repos">;
    fullName: string;
    githubInstallationId: string;
  };
  voiceProfile: {
    summary: string;
    rules: string[];
    confirmedAt?: number;
  };
};
