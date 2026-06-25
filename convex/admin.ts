import { v } from "convex/values";
import { env, query } from "./_generated/server";

const MAX_ADMIN_ROWS = 500;
const RECENT_ACTIVITY_LIMIT = 8;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const metricTotalsValidator = v.object({
  users: v.number(),
  connectedRepos: v.number(),
  xConnectedUsers: v.number(),
  activeSubscriptions: v.number(),
  draftsTotal: v.number(),
  draftsDraft: v.number(),
  draftsPosted: v.number(),
  draftsDiscarded: v.number(),
  xPostsPosted: v.number(),
});

const last30DaysValidator = v.object({
  newUsers: v.number(),
  newRepos: v.number(),
  newActiveSubscriptions: v.number(),
  xUsersConnected: v.number(),
  draftsCreated: v.number(),
  xPostsPosted: v.number(),
});

const recentActivityValidator = v.object({
  draftId: v.id("drafts"),
  repoFullName: v.string(),
  preview: v.string(),
  postedAt: v.number(),
  xPostId: v.string(),
});

export const overview = query({
  args: {},
  returns: v.union(
    v.object({
      state: v.literal("signedOut"),
    }),
    v.object({
      state: v.literal("forbidden"),
    }),
    v.object({
      state: v.literal("ready"),
      generatedAt: v.number(),
      maxRowsPerTable: v.number(),
      totals: metricTotalsValidator,
      last30Days: last30DaysValidator,
      recentActivity: v.array(recentActivityValidator),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return { state: "signedOut" as const };
    }

    if (identity.email !== env.ADMIN_EMAIL) {
      return { state: "forbidden" as const };
    }

    const now = Date.now();
    const thirtyDaysAgo = now - THIRTY_DAYS_MS;
    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(MAX_ADMIN_ROWS);
    const repos = await ctx.db
      .query("repos")
      .order("desc")
      .take(MAX_ADMIN_ROWS);
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(MAX_ADMIN_ROWS);
    const drafts = await ctx.db
      .query("drafts")
      .order("desc")
      .take(MAX_ADMIN_ROWS);
    const recentPostedDrafts = await ctx.db
      .query("drafts")
      .withIndex("by_status", (q) => q.eq("status", "posted"))
      .order("desc")
      .take(RECENT_ACTIVITY_LIMIT * 2);

    const recentActivity = [];

    for (const draft of recentPostedDrafts) {
      if (!draft.xPostId || !draft.postedAt) {
        continue;
      }

      const repo = await ctx.db.get(draft.repoId);

      recentActivity.push({
        draftId: draft._id,
        repoFullName: repo?.fullName ?? "Unknown repository",
        preview: previewText(
          draft.chosenText ?? draft.variants[0] ?? draft.commitMessage,
        ),
        postedAt: draft.postedAt,
        xPostId: draft.xPostId,
      });

      if (recentActivity.length >= RECENT_ACTIVITY_LIMIT) {
        break;
      }
    }

    return {
      state: "ready" as const,
      generatedAt: now,
      maxRowsPerTable: MAX_ADMIN_ROWS,
      totals: {
        users: users.length,
        connectedRepos: repos.length,
        xConnectedUsers: users.filter((user) => user.xUserId).length,
        activeSubscriptions: subscriptions.filter(
          (subscription) => subscription.currentPeriodEnd > now,
        ).length,
        draftsTotal: drafts.length,
        draftsDraft: drafts.filter((draft) => draft.status === "draft").length,
        draftsPosted: drafts.filter((draft) => draft.status === "posted").length,
        draftsDiscarded: drafts.filter((draft) => draft.status === "discarded")
          .length,
        xPostsPosted: drafts.filter(
          (draft) => draft.status === "posted" && draft.xPostId,
        ).length,
      },
      last30Days: {
        newUsers: users.filter((user) => user._creationTime >= thirtyDaysAgo)
          .length,
        newRepos: repos.filter((repo) => repo.connectedAt >= thirtyDaysAgo)
          .length,
        newActiveSubscriptions: subscriptions.filter(
          (subscription) =>
            subscription.currentPeriodEnd > now &&
            subscription._creationTime >= thirtyDaysAgo,
        ).length,
        xUsersConnected: users.filter(
          (user) => user.xConnectedAt && user.xConnectedAt >= thirtyDaysAgo,
        ).length,
        draftsCreated: drafts.filter(
          (draft) => draft._creationTime >= thirtyDaysAgo,
        ).length,
        xPostsPosted: drafts.filter(
          (draft) =>
            draft.status === "posted" &&
            draft.xPostId &&
            draft.postedAt &&
            draft.postedAt >= thirtyDaysAgo,
        ).length,
      },
      recentActivity,
    };
  },
});

function previewText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137)}...`;
}
