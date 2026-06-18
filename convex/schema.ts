import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkTokenIdentifier: v.string(),
    email: v.string(),
    githubId: v.optional(v.string()),
    xUserId: v.optional(v.string()),
    xAccessToken: v.optional(v.string()),
    xRefreshToken: v.optional(v.string()),
    xConnectedAt: v.optional(v.number()),
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
    webhookId: v.string(),
    connectedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_githubRepoId", ["githubRepoId"])
    .index("by_userId_and_githubRepoId", ["userId", "githubRepoId"]),

  drafts: defineTable({
    userId: v.id("users"),
    repoId: v.id("repos"),
    commitSha: v.string(),
    commitMessage: v.string(),
    variants: v.array(v.string()),
    chosenText: v.optional(v.string()),
    mediaId: v.optional(v.string()),
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
});
