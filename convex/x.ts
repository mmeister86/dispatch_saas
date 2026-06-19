import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  env,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

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
