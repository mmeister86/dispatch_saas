import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { fetchXPostMetrics } from "./xApi";
import type { Doc, Id } from "./_generated/dataModel";

const FIRST_REFRESH_DELAY_MS = 5 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const REFRESH_WINDOW_MS = 30 * DAY_MS;
const MAX_DUE_REFRESHES = 20;
const MAX_REFRESH_FAILURES = 3;

const metricsAccessValidator = v.union(
  v.literal("full"),
  v.literal("public_only"),
);

const optionalMetricValidator = {
  capturedAt: v.optional(v.number()),
  likeCount: v.optional(v.number()),
  replyCount: v.optional(v.number()),
  retweetCount: v.optional(v.number()),
  quoteCount: v.optional(v.number()),
  impressionCount: v.optional(v.number()),
  urlLinkClicks: v.optional(v.number()),
  userProfileClicks: v.optional(v.number()),
  engagements: v.optional(v.number()),
  metricsAccess: v.optional(metricsAccessValidator),
};

export const summary = query({
  args: {},
  returns: v.object({
    windowLabel: v.string(),
    postCount: v.number(),
    snapshotCount: v.number(),
    totalImpressions: v.number(),
    totalLikes: v.number(),
    totalReplies: v.number(),
    totalRetweets: v.number(),
    totalQuotes: v.number(),
    totalEngagements: v.number(),
    engagementRate: v.number(),
    metricsPending: v.boolean(),
    privateMetricsUnavailable: v.boolean(),
    recentPosts: v.array(
      v.object({
        draftId: v.id("drafts"),
        xPostId: v.string(),
        postedAt: v.number(),
        repoFullName: v.string(),
        text: v.string(),
        ...optionalMetricValidator,
      }),
    ),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return emptySummary();
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkTokenIdentifier", (q) =>
        q.eq("clerkTokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user === null) {
      return emptySummary();
    }

    const snapshots = await ctx.db
      .query("xPostMetricSnapshots")
      .withIndex("by_userId_and_capturedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
    const refreshes = await ctx.db
      .query("xPostMetricRefreshes")
      .withIndex("by_userId_and_postedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    const latestByDraft = latestSnapshotsByDraft(snapshots);
    const recentPosts: SummaryPost[] = [];

    for (const refresh of refreshes) {
      const draft = await ctx.db.get(refresh.draftId);
      const repo = draft ? await ctx.db.get(draft.repoId) : null;
      const snapshot = latestByDraft.get(refresh.draftId);

      recentPosts.push({
        draftId: refresh.draftId,
        xPostId: refresh.xPostId,
        postedAt: refresh.postedAt,
        repoFullName: repo?.fullName ?? "Unknown repository",
        text: draftText(draft),
        ...snapshotFields(snapshot),
      });
    }

    const latestSnapshots = Array.from(latestByDraft.values());
    const totalLikes = sumMetric(latestSnapshots, "likeCount");
    const totalReplies = sumMetric(latestSnapshots, "replyCount");
    const totalRetweets = sumMetric(latestSnapshots, "retweetCount");
    const totalQuotes = sumMetric(latestSnapshots, "quoteCount");
    const totalImpressions = sumMetric(latestSnapshots, "impressionCount");
    const fallbackEngagements = totalLikes + totalReplies + totalRetweets + totalQuotes;
    const totalEngagements =
      sumMetric(latestSnapshots, "engagements") || fallbackEngagements;

    return {
      windowLabel: "Last 30 days",
      postCount: refreshes.length,
      snapshotCount: latestSnapshots.length,
      totalImpressions,
      totalLikes,
      totalReplies,
      totalRetweets,
      totalQuotes,
      totalEngagements,
      engagementRate:
        totalImpressions > 0 ? totalEngagements / totalImpressions : 0,
      metricsPending: refreshes.some(
        (refresh) => !latestByDraft.has(refresh.draftId),
      ),
      privateMetricsUnavailable: recentPosts.some(
        (post) => post.metricsAccess === "public_only",
      ),
      recentPosts,
    };
  },
});

export const enqueuePostMetrics = internalMutation({
  args: {
    userId: v.id("users"),
    draftId: v.id("drafts"),
    xPostId: v.string(),
    postedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("xPostMetricRefreshes")
      .withIndex("by_userId_and_draftId", (q) =>
        q.eq("userId", args.userId).eq("draftId", args.draftId),
      )
      .unique();
    const nextRefreshAt = args.postedAt + FIRST_REFRESH_DELAY_MS;

    if (existing) {
      await ctx.db.patch(existing._id, {
        xPostId: args.xPostId,
        postedAt: args.postedAt,
        nextRefreshAt,
        failureCount: 0,
        stoppedAt: undefined,
      });
      return null;
    }

    await ctx.db.insert("xPostMetricRefreshes", {
      userId: args.userId,
      draftId: args.draftId,
      xPostId: args.xPostId,
      postedAt: args.postedAt,
      nextRefreshAt,
      failureCount: 0,
    });

    return null;
  },
});

export const dueRefreshes = internalQuery({
  args: {
    now: v.number(),
    limit: v.number(),
  },
  returns: v.array(
    v.object({
      refreshId: v.id("xPostMetricRefreshes"),
      userId: v.id("users"),
      draftId: v.id("drafts"),
      xPostId: v.string(),
      postedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const due = await ctx.db
      .query("xPostMetricRefreshes")
      .withIndex("by_nextRefreshAt", (q) => q.lte("nextRefreshAt", args.now))
      .take(Math.min(args.limit, MAX_DUE_REFRESHES));

    return due
      .filter((refresh) => !refresh.stoppedAt)
      .map((refresh) => ({
        refreshId: refresh._id,
        userId: refresh.userId,
        draftId: refresh.draftId,
        xPostId: refresh.xPostId,
        postedAt: refresh.postedAt,
      }));
  },
});

export const recordMetricSnapshot = internalMutation({
  args: {
    refreshId: v.id("xPostMetricRefreshes"),
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
    metricsAccess: metricsAccessValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const refresh = await ctx.db.get(args.refreshId);

    if (
      refresh === null ||
      refresh.userId !== args.userId ||
      refresh.draftId !== args.draftId
    ) {
      return null;
    }

    await ctx.db.insert("xPostMetricSnapshots", {
      userId: args.userId,
      draftId: args.draftId,
      xPostId: args.xPostId,
      capturedAt: args.capturedAt,
      likeCount: args.likeCount,
      replyCount: args.replyCount,
      retweetCount: args.retweetCount,
      quoteCount: args.quoteCount,
      ...(args.impressionCount !== undefined
        ? { impressionCount: args.impressionCount }
        : {}),
      ...(args.urlLinkClicks !== undefined
        ? { urlLinkClicks: args.urlLinkClicks }
        : {}),
      ...(args.userProfileClicks !== undefined
        ? { userProfileClicks: args.userProfileClicks }
        : {}),
      ...(args.engagements !== undefined ? { engagements: args.engagements } : {}),
      metricsAccess: args.metricsAccess,
    });

    const nextRefreshAt = nextRefreshAtForPost(refresh.postedAt, args.capturedAt);

    await ctx.db.patch(args.refreshId, {
      lastFetchedAt: args.capturedAt,
      failureCount: 0,
      metricsAccess: args.metricsAccess,
      ...(nextRefreshAt
        ? { nextRefreshAt, stoppedAt: undefined }
        : { stoppedAt: args.capturedAt }),
    });

    return null;
  },
});

export const recordMetricFetchFailed = internalMutation({
  args: {
    refreshId: v.id("xPostMetricRefreshes"),
    now: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const refresh = await ctx.db.get(args.refreshId);

    if (refresh === null || refresh.stoppedAt) {
      return null;
    }

    const failureCount = refresh.failureCount + 1;

    await ctx.db.patch(args.refreshId, {
      failureCount,
      nextRefreshAt: args.now + HOUR_MS * failureCount,
      ...(failureCount >= MAX_REFRESH_FAILURES ? { stoppedAt: args.now } : {}),
    });

    return null;
  },
});

export const refreshDuePostMetrics = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const due: DueMetricRefresh[] = await ctx.runQuery(
      internal.analytics.dueRefreshes,
      {
        now,
        limit: MAX_DUE_REFRESHES,
      },
    );

    for (const refresh of due) {
      try {
        let credentials: AnalyticsCredentials = await ctx.runQuery(
          internal.x.getAnalyticsAccessToken,
          { userId: refresh.userId },
        );

        if (!credentials.connected) {
          await ctx.runMutation(internal.analytics.recordMetricFetchFailed, {
            refreshId: refresh.refreshId,
            now: Date.now(),
          });
          continue;
        }

        if (credentials.tokenExpiresAt <= Date.now()) {
          await ctx.runAction(internal.x.refreshUserToken, {
            userId: refresh.userId,
          });
          credentials = await ctx.runQuery(internal.x.getAnalyticsAccessToken, {
            userId: refresh.userId,
          });
        }

        if (!credentials.connected) {
          await ctx.runMutation(internal.analytics.recordMetricFetchFailed, {
            refreshId: refresh.refreshId,
            now: Date.now(),
          });
          continue;
        }

        const metrics = await fetchXPostMetrics({
          accessToken: credentials.accessToken,
          xPostId: refresh.xPostId,
        });

        await ctx.runMutation(internal.analytics.recordMetricSnapshot, {
          refreshId: refresh.refreshId,
          userId: refresh.userId,
          draftId: refresh.draftId,
          xPostId: refresh.xPostId,
          capturedAt: Date.now(),
          ...metrics,
        });
      } catch (err) {
        console.warn("[x-post-analytics]", {
          event: "refresh_failed",
          refreshId: refresh.refreshId,
          errorName: err instanceof Error ? err.name : "UnknownError",
        });
        await ctx.runMutation(internal.analytics.recordMetricFetchFailed, {
          refreshId: refresh.refreshId,
          now: Date.now(),
        });
      }
    }

    return null;
  },
});

type DueMetricRefresh = {
  refreshId: Id<"xPostMetricRefreshes">;
  userId: Id<"users">;
  draftId: Id<"drafts">;
  xPostId: string;
  postedAt: number;
};

type AnalyticsCredentials =
  | {
      connected: false;
    }
  | {
      connected: true;
      accessToken: string;
      tokenExpiresAt: number;
    };

type SummaryPost = {
  draftId: Id<"drafts">;
  xPostId: string;
  postedAt: number;
  repoFullName: string;
  text: string;
  capturedAt?: number;
  likeCount?: number;
  replyCount?: number;
  retweetCount?: number;
  quoteCount?: number;
  impressionCount?: number;
  urlLinkClicks?: number;
  userProfileClicks?: number;
  engagements?: number;
  metricsAccess?: "full" | "public_only";
};

function emptySummary() {
  return {
    windowLabel: "Last 30 days",
    postCount: 0,
    snapshotCount: 0,
    totalImpressions: 0,
    totalLikes: 0,
    totalReplies: 0,
    totalRetweets: 0,
    totalQuotes: 0,
    totalEngagements: 0,
    engagementRate: 0,
    metricsPending: false,
    privateMetricsUnavailable: false,
    recentPosts: [],
  };
}

function latestSnapshotsByDraft(snapshots: Doc<"xPostMetricSnapshots">[]) {
  const latest = new Map<Id<"drafts">, Doc<"xPostMetricSnapshots">>();

  for (const snapshot of snapshots) {
    if (!latest.has(snapshot.draftId)) {
      latest.set(snapshot.draftId, snapshot);
    }
  }

  return latest;
}

function snapshotFields(snapshot: Doc<"xPostMetricSnapshots"> | undefined) {
  if (!snapshot) {
    return {};
  }

  return {
    capturedAt: snapshot.capturedAt,
    likeCount: snapshot.likeCount,
    replyCount: snapshot.replyCount,
    retweetCount: snapshot.retweetCount,
    quoteCount: snapshot.quoteCount,
    ...(snapshot.impressionCount !== undefined
      ? { impressionCount: snapshot.impressionCount }
      : {}),
    ...(snapshot.urlLinkClicks !== undefined
      ? { urlLinkClicks: snapshot.urlLinkClicks }
      : {}),
    ...(snapshot.userProfileClicks !== undefined
      ? { userProfileClicks: snapshot.userProfileClicks }
      : {}),
    ...(snapshot.engagements !== undefined
      ? { engagements: snapshot.engagements }
      : {}),
    metricsAccess: snapshot.metricsAccess,
  };
}

function draftText(draft: Doc<"drafts"> | null) {
  return draft?.chosenText ?? draft?.variants[0] ?? draft?.commitMessage ?? "";
}

function sumMetric(
  snapshots: Doc<"xPostMetricSnapshots">[],
  field:
    | "likeCount"
    | "replyCount"
    | "retweetCount"
    | "quoteCount"
    | "impressionCount"
    | "engagements",
) {
  return snapshots.reduce((total, snapshot) => total + (snapshot[field] ?? 0), 0);
}

function nextRefreshAtForPost(postedAt: number, now: number) {
  const age = now - postedAt;

  if (age >= REFRESH_WINDOW_MS) {
    return null;
  }

  return now + (age < DAY_MS ? HOUR_MS : DAY_MS);
}
