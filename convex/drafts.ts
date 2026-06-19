import { v } from "convex/values";
import { query } from "./_generated/server";

export const listForReview = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("drafts"),
      repoFullName: v.string(),
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
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkTokenIdentifier", (q) =>
        q.eq("clerkTokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user === null) {
      return [];
    }

    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    const rows = [];

    for (const draft of drafts) {
      const repo = await ctx.db.get(draft.repoId);

      rows.push({
        _id: draft._id,
        repoFullName: repo?.fullName ?? "Unknown repository",
        commitSha: draft.commitSha,
        commitMessage: draft.commitMessage,
        variants: draft.variants,
        ...(draft.chosenText ? { chosenText: draft.chosenText } : {}),
        ...(draft.mediaId ? { mediaId: draft.mediaId } : {}),
        status: draft.status,
        ...(draft.xPostId ? { xPostId: draft.xPostId } : {}),
        ...(draft.postedAt ? { postedAt: draft.postedAt } : {}),
        createdAt: draft._creationTime,
      });
    }

    return rows;
  },
});
