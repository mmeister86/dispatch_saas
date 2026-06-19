import { v } from "convex/values";
import { internal } from "./_generated/api";
import { rateLimiter } from "./rateLimits";
import { createXPost } from "./xApi";
import {
  action,
  env,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import {
  effectivePostsThisPeriodForSubscription,
  postLimitForPlan,
} from "./planLimits";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_ME_URL = "https://api.x.com/2/users/me";
const X_SCOPES = "tweet.read tweet.write users.read offline.access";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export const connectionStatus = query({
  args: {},
  returns: v.union(
    v.object({
      connected: v.literal(false),
    }),
    v.object({
      connected: v.literal(true),
      username: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null || !user.xUserId) {
      return { connected: false as const };
    }

    return {
      connected: true as const,
      ...(user.xUsername ? { username: user.xUsername } : {}),
    };
  },
});

export const startConnection = action({
  args: {},
  returns: v.object({ url: v.string() }),
  handler: async (ctx): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before connecting X.");
    }

    const userId: Id<"users"> = await ctx.runQuery(
      internal.x.requireActiveXUser,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
      },
    );
    const state = randomBase64Url(32);
    const codeVerifier = randomBase64Url(64);
    const codeChallenge = await sha256Base64Url(codeVerifier);

    await ctx.runMutation(internal.x.storeOAuthState, {
      userId,
      state,
      codeVerifier,
      expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
    });

    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.X_CLIENT_ID,
      redirect_uri: env.X_OAUTH_REDIRECT_URI,
      scope: X_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return { url: `${X_AUTHORIZE_URL}?${params.toString()}` };
  },
});

export const postDraft = action({
  args: {
    draftId: v.id("drafts"),
    text: v.string(),
  },
  returns: v.object({ xPostId: v.string() }),
  handler: async (ctx, args): Promise<{ xPostId: string }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Sign in before posting.");
    }

    const trimmedText = args.text.trim();

    if (trimmedText.length === 0) {
      throw new Error("Post text cannot be empty.");
    }

    if (trimmedText.length > 280) {
      throw new Error("Post text must be 280 characters or fewer.");
    }

    const postingContext: DraftPostingContext = await ctx.runQuery(
      internal.x.getDraftForPosting,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
        draftId: args.draftId,
      },
    );

    if (postingContext.status === "posted") {
      return { xPostId: postingContext.xPostId };
    }

    const postingLimit = await rateLimiter.limit(ctx, "postDraftToX", {
      key: postingContext.userId,
    });

    if (!postingLimit.ok) {
      throw new Error("You're posting too quickly. Try again in a few seconds.");
    }

    if (postingContext.tokenExpiresAt <= Date.now()) {
      await ctx.runAction(internal.x.refreshUserToken, {
        userId: postingContext.userId,
      });
    }

    const refreshedContext: DraftPostingContext = await ctx.runQuery(
      internal.x.getDraftForPosting,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
        draftId: args.draftId,
      },
    );

    if (refreshedContext.status === "posted") {
      return { xPostId: refreshedContext.xPostId };
    }

    const claimedDraft = await ctx.runMutation(internal.x.claimDraftPosting, {
      draftId: args.draftId,
      userId: refreshedContext.userId,
      chosenText: trimmedText,
      now: Date.now(),
    });

    let post: { xPostId: string };
    try {
      post = await createXPost({
        accessToken: refreshedContext.accessToken,
        text: trimmedText,
        mediaId: claimedDraft.mediaId,
      });
    } catch (err) {
      await ctx.runMutation(internal.x.clearDraftPosting, {
        draftId: args.draftId,
        userId: refreshedContext.userId,
        subscriptionId: claimedDraft.subscriptionId,
        subscriptionPeriodEnd: claimedDraft.subscriptionPeriodEnd,
      });
      throw err;
    }

    const postedAt = Date.now();

    try {
      await ctx.runMutation(internal.x.markDraftPosted, {
        draftId: args.draftId,
        userId: refreshedContext.userId,
        chosenText: trimmedText,
        xPostId: post.xPostId,
        postedAt,
      });
    } catch {
      await ctx.runMutation(internal.x.recoverPostedDraftRecord, {
        draftId: args.draftId,
        userId: refreshedContext.userId,
        chosenText: trimmedText,
        xPostId: post.xPostId,
        postedAt,
      });
    }

    return post;
  },
});

export const completeOAuthCallback = internalAction({
  args: {
    code: v.string(),
    state: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const oauthState: OAuthState = await ctx.runMutation(
      internal.x.consumeOAuthState,
      {
        state: args.state,
        now: Date.now(),
      },
    );
    const token = await requestToken({
      grant_type: "authorization_code",
      code: args.code,
      code_verifier: oauthState.codeVerifier,
      redirect_uri: env.X_OAUTH_REDIRECT_URI,
    });
    const profile = await fetchXProfile(token.access_token);

    await ctx.runMutation(internal.x.storeXTokens, {
      userId: oauthState.userId,
      xUserId: profile.data.id,
      xUsername: profile.data.username,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiresAt: Date.now() + token.expires_in * 1000,
      connectedAt: Date.now(),
    });

    return null;
  },
});

export const refreshUserToken = internalAction({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const refreshToken: string = await ctx.runQuery(
      internal.x.getRefreshToken,
      {
        userId: args.userId,
      },
    );
    const token = await requestToken({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    await ctx.runMutation(internal.x.storeXTokens, {
      userId: args.userId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiresAt: Date.now() + token.expires_in * 1000,
      connectedAt: Date.now(),
    });

    return null;
  },
});

export const requireActiveXUser = internalQuery({
  args: {
    clerkTokenIdentifier: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkTokenIdentifier", (q) =>
        q.eq("clerkTokenIdentifier", args.clerkTokenIdentifier),
      )
      .unique();

    if (user === null) {
      throw new Error("Subscribe before connecting X.");
    }

    const hasActiveSubscription: boolean = await ctx.runQuery(
      internal.billing.hasActiveSubscriptionForUser,
      { userId: user._id },
    );

    if (!hasActiveSubscription) {
      throw new Error("Subscribe before connecting X.");
    }

    return user._id;
  },
});

export const getDraftForPosting = internalQuery({
  args: {
    clerkTokenIdentifier: v.string(),
    draftId: v.id("drafts"),
  },
  returns: v.union(
    v.object({
      status: v.literal("draft"),
      userId: v.id("users"),
      accessToken: v.string(),
      tokenExpiresAt: v.number(),
      mediaId: v.optional(v.string()),
    }),
    v.object({
      status: v.literal("posted"),
      xPostId: v.string(),
    }),
  ),
  handler: async (ctx, args): Promise<DraftPostingContext> => {
    const user = await getSubscribedUserByTokenIdentifier(
      ctx,
      args.clerkTokenIdentifier,
    );
    const draft = await ctx.db.get(args.draftId);

    if (draft === null || draft.userId !== user._id) {
      throw new Error("Draft not found.");
    }

    if (draft.status === "posted") {
      if (!draft.xPostId) {
        throw new Error("Posted draft is missing its X post id.");
      }

      return {
        status: "posted",
        xPostId: draft.xPostId,
      };
    }

    if (draft.status !== "draft") {
      throw new Error("Only draft posts can be posted.");
    }

    if (draft.postingStartedAt) {
      throw new Error("This draft is already being posted.");
    }

    if (!user.xAccessToken || !user.xRefreshToken || !user.xTokenExpiresAt) {
      throw new Error("Connect X before posting.");
    }

    return {
      status: "draft",
      userId: user._id,
      accessToken: user.xAccessToken,
      tokenExpiresAt: user.xTokenExpiresAt,
      ...(draft.mediaId ? { mediaId: draft.mediaId } : {}),
    };
  },
});

export const getDraftForMediaUpload = internalQuery({
  args: {
    clerkTokenIdentifier: v.string(),
    draftId: v.id("drafts"),
  },
  returns: v.object({
    userId: v.id("users"),
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
    mediaId: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<DraftMediaUploadContext> => {
    const user = await getSubscribedUserByTokenIdentifier(
      ctx,
      args.clerkTokenIdentifier,
    );
    const draft = await ctx.db.get(args.draftId);

    if (draft === null || draft.userId !== user._id) {
      throw new Error("Draft not found.");
    }

    if (draft.status !== "draft") {
      throw new Error("Only draft posts can receive media.");
    }

    if (draft.postingStartedAt) {
      throw new Error("This draft is already being posted.");
    }

    if (!user.xAccessToken || !user.xRefreshToken || !user.xTokenExpiresAt) {
      throw new Error("Connect X before uploading media.");
    }

    return {
      userId: user._id,
      accessToken: user.xAccessToken,
      tokenExpiresAt: user.xTokenExpiresAt,
      ...(draft.mediaId ? { mediaId: draft.mediaId } : {}),
    };
  },
});

export const storeOAuthState = internalMutation({
  args: {
    userId: v.id("users"),
    state: v.string(),
    codeVerifier: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingStates = await ctx.db
      .query("xOAuthStates")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(20);

    for (const existingState of existingStates) {
      await ctx.db.delete(existingState._id);
    }

    await ctx.db.insert("xOAuthStates", {
      userId: args.userId,
      state: args.state,
      codeVerifier: args.codeVerifier,
      expiresAt: args.expiresAt,
    });

    return null;
  },
});

export const consumeOAuthState = internalMutation({
  args: {
    state: v.string(),
    now: v.number(),
  },
  returns: v.object({
    userId: v.id("users"),
    codeVerifier: v.string(),
  }),
  handler: async (ctx, args): Promise<OAuthState> => {
    const existing = await ctx.db
      .query("xOAuthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();

    if (existing === null) {
      throw new Error("X connection expired. Try connecting again.");
    }

    if (existing.expiresAt < args.now) {
      await ctx.db.delete(existing._id);
      throw new Error("X connection expired. Try connecting again.");
    }

    await ctx.db.delete(existing._id);

    return {
      userId: existing.userId,
      codeVerifier: existing.codeVerifier,
    };
  },
});

export const storeXTokens = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.string(),
    tokenExpiresAt: v.number(),
    connectedAt: v.number(),
    xUserId: v.optional(v.string()),
    xUsername: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      xAccessToken: args.accessToken,
      xRefreshToken: args.refreshToken,
      xTokenExpiresAt: args.tokenExpiresAt,
      xConnectedAt: args.connectedAt,
      ...(args.xUserId ? { xUserId: args.xUserId } : {}),
      ...(args.xUsername ? { xUsername: args.xUsername } : {}),
    });

    return null;
  },
});

export const getRefreshToken = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (user === null || !user.xRefreshToken) {
      throw new Error("Connect X before refreshing its token.");
    }

    return user.xRefreshToken;
  },
});

export const claimDraftPosting = internalMutation({
  args: {
    draftId: v.id("drafts"),
    userId: v.id("users"),
    chosenText: v.string(),
    now: v.number(),
  },
  returns: v.object({
    mediaId: v.optional(v.string()),
    subscriptionId: v.id("subscriptions"),
    subscriptionPeriodEnd: v.number(),
  }),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);

    if (draft === null || draft.userId !== args.userId) {
      throw new Error("Draft not found.");
    }

    if (draft.status !== "draft") {
      throw new Error("Only draft posts can be posted.");
    }

    if (draft.postingStartedAt) {
      throw new Error("This draft is already being posted.");
    }

    const subscription = await getActiveSubscriptionForPosting(
      ctx,
      args.userId,
      args.now,
    );
    const effectivePostsThisPeriod =
      await effectivePostsThisPeriodForSubscription(ctx, subscription);
    const postLimit = postLimitForPlan(subscription.plan);

    if (effectivePostsThisPeriod >= postLimit) {
      if (subscription.plan === "good") {
        throw new Error("Upgrade to Better to keep posting this period.");
      }

      throw new Error("You have used all posts in this billing period.");
    }

    await ctx.db.patch(subscription._id, {
      postsThisPeriod: effectivePostsThisPeriod + 1,
    });

    await ctx.db.patch(args.draftId, {
      chosenText: args.chosenText,
      postingStartedAt: args.now,
    });

    return {
      subscriptionId: subscription._id,
      subscriptionPeriodEnd: subscription.currentPeriodEnd,
      ...(draft.mediaId ? { mediaId: draft.mediaId } : {}),
    };
  },
});

export const clearDraftPosting = internalMutation({
  args: {
    draftId: v.id("drafts"),
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    subscriptionPeriodEnd: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);

    if (draft === null || draft.userId !== args.userId) {
      return null;
    }

    if (draft.status !== "draft") {
      return null;
    }

    if (!draft.postingStartedAt) {
      return null;
    }

    const subscription = await ctx.db.get(args.subscriptionId);

    if (
      subscription !== null &&
      subscription.userId === args.userId &&
      subscription.currentPeriodEnd === args.subscriptionPeriodEnd
    ) {
      await ctx.db.patch(args.subscriptionId, {
        postsThisPeriod: Math.max(0, subscription.postsThisPeriod - 1),
      });
    }

    await ctx.db.patch(args.draftId, {
      postingStartedAt: undefined,
    });

    return null;
  },
});

export const markDraftPosted = internalMutation({
  args: {
    draftId: v.id("drafts"),
    userId: v.id("users"),
    chosenText: v.string(),
    xPostId: v.string(),
    postedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);

    if (draft === null || draft.userId !== args.userId) {
      throw new Error("Draft not found.");
    }

    if (draft.status === "posted") {
      return null;
    }

    if (draft.status !== "draft") {
      throw new Error("Only draft posts can be posted.");
    }

    await ctx.db.patch(args.draftId, {
      chosenText: args.chosenText,
      status: "posted",
      xPostId: args.xPostId,
      postedAt: args.postedAt,
      postingStartedAt: undefined,
    });

    return null;
  },
});

export const recoverPostedDraftRecord = internalMutation({
  args: {
    draftId: v.id("drafts"),
    userId: v.id("users"),
    chosenText: v.string(),
    xPostId: v.string(),
    postedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);

    if (draft === null || draft.userId !== args.userId) {
      throw new Error("Draft not found.");
    }

    await ctx.db.patch(args.draftId, {
      chosenText: args.chosenText,
      status: "posted",
      xPostId: args.xPostId,
      postedAt: args.postedAt,
      postingStartedAt: undefined,
    });

    return null;
  },
});

export const storeDraftMedia = internalMutation({
  args: {
    draftId: v.id("drafts"),
    userId: v.id("users"),
    mediaId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);

    if (draft === null || draft.userId !== args.userId) {
      throw new Error("Draft not found.");
    }

    if (draft.status !== "draft") {
      throw new Error("Only draft posts can receive media.");
    }

    if (draft.postingStartedAt) {
      throw new Error("This draft is already being posted.");
    }

    await ctx.db.patch(args.draftId, {
      mediaId: args.mediaId,
    });

    return null;
  },
});

type XTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type XProfileResponse = {
  data: {
    id: string;
    username: string;
  };
};

type OAuthState = {
  userId: Id<"users">;
  codeVerifier: string;
};

type DraftPostingContext =
  | {
      status: "draft";
      userId: Id<"users">;
      accessToken: string;
      tokenExpiresAt: number;
      mediaId?: string;
    }
  | {
      status: "posted";
      xPostId: string;
    };

type DraftMediaUploadContext = {
  userId: Id<"users">;
  accessToken: string;
  tokenExpiresAt: number;
  mediaId?: string;
};

async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_clerkTokenIdentifier", (q) =>
      q.eq("clerkTokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function getSubscribedUserByTokenIdentifier(
  ctx: QueryCtx,
  clerkTokenIdentifier: string,
): Promise<Doc<"users">> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkTokenIdentifier", (q) =>
      q.eq("clerkTokenIdentifier", clerkTokenIdentifier),
    )
    .unique();

  if (user === null) {
    throw new Error("Subscribe before posting.");
  }

  const hasActiveSubscription: boolean = await ctx.runQuery(
    internal.billing.hasActiveSubscriptionForUser,
    { userId: user._id },
  );

  if (!hasActiveSubscription) {
    throw new Error("Subscribe before posting.");
  }

  return user;
}

async function getActiveSubscriptionForPosting(
  ctx: MutationCtx,
  userId: Id<"users">,
  now: number,
): Promise<Doc<"subscriptions">> {
  const activeSubscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId_and_status_and_currentPeriodEnd", (q) =>
      q
        .eq("userId", userId)
        .eq("status", "active")
        .gt("currentPeriodEnd", now),
    )
    .take(1);
  const subscription = activeSubscriptions[0] ?? null;

  if (subscription === null) {
    throw new Error("Subscribe before posting.");
  }

  return subscription;
}

async function requestToken(params: Record<string, string>) {
  const body = new URLSearchParams({
    ...params,
  });
  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuthCredentials()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`X token request failed: ${response.status}`);
  }

  return (await response.json()) as XTokenResponse;
}

async function fetchXProfile(accessToken: string) {
  const response = await fetch(X_ME_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`X profile request failed: ${response.status}`);
  }

  return (await response.json()) as XProfileResponse;
}

function basicAuthCredentials() {
  return btoa(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`);
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return base64UrlEncodeBytes(new Uint8Array(digest));
}

function randomBase64Url(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncodeBytes(bytes);
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let value = "";

  for (const byte of bytes) {
    value += String.fromCharCode(byte);
  }

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
