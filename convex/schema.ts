import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkTokenIdentifier: v.string(),
    email: v.string(),
    githubId: v.optional(v.string()),
    githubInstallationId: v.optional(v.string()),
    xUserId: v.optional(v.string()),
    xAccessToken: v.optional(v.string()),
    xRefreshToken: v.optional(v.string()),
    xConnectedAt: v.optional(v.number()),
    xTokenExpiresAt: v.optional(v.number()),
    xUsername: v.optional(v.string()),
  })
    .index("by_clerkTokenIdentifier", ["clerkTokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_githubId", ["githubId"])
    .index("by_xUserId", ["xUserId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    lemonCustomerId: v.string(),
    lemonSubscriptionId: v.string(),
    plan: v.union(v.literal("good"), v.literal("better")),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
    ),
    currentPeriodEnd: v.number(),
    postsThisPeriod: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_status_and_currentPeriodEnd", [
      "userId",
      "status",
      "currentPeriodEnd",
    ])
    .index("by_lemonCustomerId", ["lemonCustomerId"])
    .index("by_lemonSubscriptionId", ["lemonSubscriptionId"])
    .index("by_status", ["status"]),

  repos: defineTable({
    userId: v.id("users"),
    githubRepoId: v.string(),
    fullName: v.string(),
    private: v.boolean(),
    htmlUrl: v.string(),
    githubInstallationId: v.string(),
    githubAccountLogin: v.optional(v.string()),
    connectedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_githubRepoId", ["githubRepoId"])
    .index("by_userId_and_githubRepoId", ["userId", "githubRepoId"])
    .index("by_userId_and_githubInstallationId", [
      "userId",
      "githubInstallationId",
    ]),

  drafts: defineTable({
    userId: v.id("users"),
    repoId: v.id("repos"),
    commitSha: v.string(),
    commitMessage: v.string(),
    variants: v.array(v.string()),
    chosenText: v.optional(v.string()),
    mediaId: v.optional(v.string()),
    postingStartedAt: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("posted"),
      v.literal("discarded"),
    ),
    xPostId: v.optional(v.string()),
    postedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_repoId_and_commitSha", ["repoId", "commitSha"])
    .index("by_status", ["status"]),

  xPostMetricRefreshes: defineTable({
    userId: v.id("users"),
    draftId: v.id("drafts"),
    xPostId: v.string(),
    postedAt: v.number(),
    nextRefreshAt: v.number(),
    lastFetchedAt: v.optional(v.number()),
    failureCount: v.number(),
    stoppedAt: v.optional(v.number()),
    metricsAccess: v.optional(v.union(v.literal("full"), v.literal("public_only"))),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_draftId", ["userId", "draftId"])
    .index("by_userId_and_postedAt", ["userId", "postedAt"])
    .index("by_draftId", ["draftId"])
    .index("by_xPostId", ["xPostId"])
    .index("by_nextRefreshAt", ["nextRefreshAt"]),

  xPostMetricSnapshots: defineTable({
    userId: v.id("users"),
    draftId: v.id("drafts"),
    xPostId: v.string(),
    capturedAt: v.number(),
    likeCount: v.number(),
    replyCount: v.number(),
    retweetCount: v.number(),
    quoteCount: v.number(),
    impressionCount: v.optional(v.number()),
    urlLinkClicks: v.optional(v.number()),
    userProfileClicks: v.optional(v.number()),
    engagements: v.optional(v.number()),
    metricsAccess: v.union(v.literal("full"), v.literal("public_only")),
  })
    .index("by_userId_and_capturedAt", ["userId", "capturedAt"])
    .index("by_draftId_and_capturedAt", ["draftId", "capturedAt"])
    .index("by_xPostId_and_capturedAt", ["xPostId", "capturedAt"]),

  voiceProfiles: defineTable({
    userId: v.id("users"),
    summary: v.string(),
    rules: v.array(v.string()),
    source: v.union(v.literal("x_import"), v.literal("manual_paste")),
    sampleCount: v.number(),
    confirmedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  xOAuthStates: defineTable({
    state: v.string(),
    codeVerifier: v.string(),
    returnPath: v.optional(v.string()),
    userId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_state", ["state"])
    .index("by_userId", ["userId"]),
});
