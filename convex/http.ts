import { httpRouter } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { rateLimiter } from "./rateLimits";
import { uploadTweetImage } from "./xApi";
import { env, httpAction, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { LegacyMediaUploadCredentials } from "./xApi";

const http = httpRouter();
const MAX_CONNECTED_REPOS_PER_PUSH = 100;
const OAUTH_STATE_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const OAUTH_CODE_MAX_LENGTH = 1024;
const MAX_TWEET_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TWEET_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

http.route({
  path: "/github/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Hub-Signature-256") ?? "";

    if (!(await isValidGithubSignature(rawBody, signature))) {
      return new Response("Invalid signature", { status: 401 });
    }

    const eventName = req.headers.get("X-GitHub-Event");

    if (eventName === "ping") {
      return new Response("OK", { status: 200 });
    }

    if (eventName !== "push") {
      return new Response("OK", { status: 200 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (!isGitHubPushWebhookPayload(payload)) {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (isDeleteOrEmptyPush(payload)) {
      return new Response("OK", { status: 200 });
    }

    const repoId = payload.repository.id;
    const draftCommits = selectDraftCommits(payload);

    if (draftCommits.length === 0) {
      return new Response("Invalid push payload", { status: 400 });
    }

    await ctx.runMutation(internal.http.createDraftsFromGithubPushWebhook, {
      githubRepoId: String(repoId),
      commits: draftCommits.map((commit) => ({
        commitSha: commit.id,
        commitMessage: commit.message,
      })),
    });

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/x/oauth/callback",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (
      error !== null ||
      code === null ||
      state === null ||
      code.length > OAUTH_CODE_MAX_LENGTH ||
      !OAUTH_STATE_PATTERN.test(state)
    ) {
      return redirectToApp("x=error");
    }

    try {
      await ctx.runAction(internal.x.completeOAuthCallback, { code, state });
      return redirectToApp("x=connected");
    } catch {
      return redirectToApp("x=error");
    }
  }),
});

http.route({
  path: "/x/media/upload",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, req) => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    });
  }),
});

http.route({
  path: "/x/media/upload",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let identity;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch {
      return jsonError("Sign in before uploading media.", 401, req);
    }

    if (identity === null) {
      return jsonError("Sign in before uploading media.", 401, req);
    }

    const contentLengthHeader = req.headers.get("Content-Length");
    const contentLength =
      contentLengthHeader === null ? NaN : Number(contentLengthHeader);

    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return jsonError("Upload must include a valid content length.", 411, req);
    }

    if (contentLength > MAX_TWEET_IMAGE_BYTES + 20_000) {
      return jsonError("Image must be 5 MB or smaller.", 413, req);
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return jsonError("Upload must be multipart form data.", 400, req);
    }

    const draftIds = formData.getAll("draftId");
    const files = formData.getAll("file");
    const draftId = draftIds[0];
    const file = files[0];

    if (
      draftIds.length !== 1 ||
      typeof draftId !== "string" ||
      draftId.length === 0
    ) {
      return jsonError("Provide exactly one draft id.", 400, req);
    }

    if (files.length !== 1 || !(file instanceof File)) {
      return jsonError("Upload one image file.", 400, req);
    }

    if (!ALLOWED_TWEET_IMAGE_TYPES.has(file.type)) {
      return jsonError("Upload a PNG, JPEG, or WebP image.", 400, req);
    }

    if (file.size > MAX_TWEET_IMAGE_BYTES) {
      return jsonError("Image must be 5 MB or smaller.", 400, req);
    }

    if (!(await hasAllowedImageSignature(file))) {
      return jsonError("Upload a valid PNG, JPEG, or WebP image.", 400, req);
    }

    try {
      const draftUploadContext = await ctx.runQuery(
        internal.x.getDraftForMediaUpload,
        {
          clerkTokenIdentifier: identity.tokenIdentifier,
          draftId: draftId as Id<"drafts">,
        },
      );

      if (draftUploadContext.mediaId) {
        return json({ mediaId: draftUploadContext.mediaId }, 200, req);
      }

      if (draftUploadContext.tokenExpiresAt <= Date.now()) {
        await ctx.runAction(internal.x.refreshUserToken, {
          userId: draftUploadContext.userId,
        });
      }

      const refreshedContext = await ctx.runQuery(
        internal.x.getDraftForMediaUpload,
        {
          clerkTokenIdentifier: identity.tokenIdentifier,
          draftId: draftId as Id<"drafts">,
        },
      );

      if (refreshedContext.mediaId) {
        return json({ mediaId: refreshedContext.mediaId }, 200, req);
      }

      const upload = await uploadTweetImage({
        accessToken: refreshedContext.accessToken,
        file,
        mediaType: file.type,
        mediaCategory: "tweet_image",
        legacyCredentials: legacyMediaUploadCredentials(
          refreshedContext.xUserId,
        ),
      });

      await ctx.runMutation(internal.x.storeDraftMedia, {
        draftId: draftId as Id<"drafts">,
        userId: refreshedContext.userId,
        mediaId: upload.mediaId,
      });

      return json({ mediaId: upload.mediaId }, 200, req);
    } catch (err) {
      return jsonError(errorMessage(err, "Image upload failed."), 400, req);
    }
  }),
});

function legacyMediaUploadCredentials(
  ownerUserId: string,
): LegacyMediaUploadCredentials | undefined {
  const consumerKey = env.X_MEDIA_UPLOAD_CONSUMER_KEY;
  const consumerSecret = env.X_MEDIA_UPLOAD_CONSUMER_SECRET;
  const accessToken = env.X_MEDIA_UPLOAD_ACCESS_TOKEN;
  const accessTokenSecret = env.X_MEDIA_UPLOAD_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    return undefined;
  }

  return {
    consumerKey,
    consumerSecret,
    accessToken,
    accessTokenSecret,
    ownerUserId,
  };
}

http.route({
  path: "/lemon-squeezy/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") ?? "";

    if (!(await isValidSignature(rawBody, signature))) {
      return new Response("Invalid signature", { status: 400 });
    }

    let event: LemonWebhookEvent;
    try {
      event = JSON.parse(rawBody) as LemonWebhookEvent;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const eventName = event.meta?.event_name;

    if (
      eventName !== "subscription_created" &&
      eventName !== "subscription_updated"
    ) {
      return new Response("OK", { status: 200 });
    }

    const attributes = event.data?.attributes;
    const userId = event.meta?.custom_data?.userId;
    const customPlan = event.meta?.custom_data?.plan;
    const subscriptionId = event.data?.id;
    const plan = attributes ? planFromVariantId(attributes.variant_id) : null;
    const status = attributes
      ? mapSubscriptionStatus(attributes.status)
      : null;

    if (
      !attributes ||
      attributes.customer_id == null ||
      !userId ||
      !plan ||
      (isPlan(customPlan) && customPlan !== plan) ||
      !status ||
      !subscriptionId
    ) {
      return new Response("Invalid subscription payload", { status: 400 });
    }

    await ctx.runMutation(internal.http.upsertSubscriptionFromWebhook, {
      userId: userId as Id<"users">,
      lemonCustomerId: String(attributes.customer_id),
      lemonSubscriptionId: subscriptionId,
      plan,
      status,
      currentPeriodEnd: parseLemonDate(periodEndForStatus(attributes)),
    });

    return new Response("OK", { status: 200 });
  }),
});

function json(value: unknown, status: number, req?: Request) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(req ? corsHeaders(req) : {}),
    },
  });
}

function jsonError(message: string, status: number, req?: Request) {
  return json({ error: message }, status, req);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
  };

  if (origin === new URL(env.APP_URL).origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

async function hasAllowedImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (file.type === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  if (file.type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (file.type === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

function redirectToApp(query: string) {
  const url = new URL(env.APP_URL);
  url.pathname = "/dashboard/settings";
  url.search = query;

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

async function isValidGithubSignature(rawBody: string, signature: string) {
  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${await hmacSha256Hex(
    rawBody,
    env.GITHUB_WEBHOOK_SECRET,
  )}`;

  return timingSafeHexEqual(expected, signature);
}

export const upsertSubscriptionFromWebhook = internalMutation({
  args: {
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_lemonSubscriptionId", (q) =>
        q.eq("lemonSubscriptionId", args.lemonSubscriptionId),
      )
      .unique();

    if (existing) {
      const postsThisPeriod =
        existing.currentPeriodEnd === args.currentPeriodEnd
          ? existing.postsThisPeriod
          : 0;

      await ctx.db.replace(existing._id, {
        userId: args.userId,
        lemonCustomerId: args.lemonCustomerId,
        lemonSubscriptionId: args.lemonSubscriptionId,
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        postsThisPeriod,
      });
      return null;
    }

    await ctx.db.insert("subscriptions", {
      userId: args.userId,
      lemonCustomerId: args.lemonCustomerId,
      lemonSubscriptionId: args.lemonSubscriptionId,
      plan: args.plan,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      postsThisPeriod: 0,
    });
    return null;
  },
});

export const createDraftsFromGithubPushWebhook = internalMutation({
  args: {
    githubRepoId: v.string(),
    commits: v.array(
      v.object({
        commitSha: v.string(),
        commitMessage: v.string(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repos = await ctx.db
      .query("repos")
      .withIndex("by_githubRepoId", (q) =>
        q.eq("githubRepoId", args.githubRepoId),
      )
      .take(MAX_CONNECTED_REPOS_PER_PUSH);

    for (const repo of repos) {
      for (const commit of args.commits) {
        const existingDraft = await ctx.db
          .query("drafts")
          .withIndex("by_repoId_and_commitSha", (q) =>
            q.eq("repoId", repo._id).eq("commitSha", commit.commitSha),
          )
          .take(1);

        if (existingDraft.length > 0) {
          continue;
        }

        const draftId = await ctx.db.insert("drafts", {
          userId: repo.userId,
          repoId: repo._id,
          commitSha: commit.commitSha,
          commitMessage: commit.commitMessage,
          variants: [],
          status: "draft",
        });

        const generationLimit = await rateLimiter.limit(
          ctx,
          "generateDraftVariants",
          {
            key: repo.userId,
            reserve: true,
          },
        );

        if (generationLimit.ok) {
          await ctx.scheduler.runAfter(
            generationLimit.retryAfter ?? 0,
            internal.generation.populateDraftVariants,
            {
              draftId: draftId,
              commitMessage: commit.commitMessage,
            },
          );
        }
      }
    }

    return null;
  },
});

async function isValidSignature(rawBody: string, signature: string) {
  if (rawBody.length === 0 || signature.length === 0) {
    return false;
  }

  const expected = await hmacSha256Hex(rawBody, env.LEMONSQUEEZY_WEBHOOK_SECRET);

  return timingSafeHexEqual(expected, signature);
}

async function hmacSha256Hex(rawBody: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function timingSafeHexEqual(expected: string, actual: string) {
  if (expected.length !== actual.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < expected.length; i += 1) {
    result |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }

  return result === 0;
}

function planFromVariantId(variantId: unknown) {
  const id = String(variantId);

  if (id === env.LEMONSQUEEZY_GOOD_VARIANT_ID) {
    return "good";
  }

  if (id === env.LEMONSQUEEZY_BETTER_VARIANT_ID) {
    return "better";
  }

  return null;
}

function mapSubscriptionStatus(status: unknown) {
  if (status === "active") {
    return "active";
  }

  if (status === "on_trial") {
    return "active";
  }

  if (status === "past_due" || status === "unpaid") {
    return "past_due";
  }

  if (
    status === "cancelled" ||
    status === "canceled" ||
    status === "expired" ||
    status === "paused"
  ) {
    return "canceled";
  }

  return null;
}

function periodEndForStatus(attributes: LemonSubscriptionAttributes) {
  const status = mapSubscriptionStatus(attributes.status);

  if (status === "canceled" && typeof attributes.ends_at === "string") {
    return attributes.ends_at;
  }

  return attributes.renews_at;
}

function parseLemonDate(value: unknown) {
  if (typeof value !== "string") {
    return Date.now();
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function isPlan(value: unknown): value is "good" | "better" {
  return value === "good" || value === "better";
}

type LemonWebhookEvent = {
  meta?: {
    event_name?: string;
    custom_data?: {
      userId?: string;
      plan?: unknown;
    };
  };
  data?: {
    id?: string;
    attributes?: LemonSubscriptionAttributes;
  };
};

type LemonSubscriptionAttributes = {
  customer_id?: string | number;
  variant_id?: string | number;
  status?: unknown;
  renews_at?: unknown;
  ends_at?: unknown;
};

type GitHubPushWebhookPayload = {
  repository: {
    id: string | number;
  };
  after?: string;
  deleted?: boolean;
  size?: number;
  commits?: unknown[];
  head_commit?: unknown;
};

function isDeleteOrEmptyPush(payload: GitHubPushWebhookPayload) {
  return (
    payload.deleted === true ||
    payload.size === 0 ||
    (Array.isArray(payload.commits) && payload.commits.length === 0)
  );
}

function isGitHubPushWebhookPayload(
  value: unknown,
): value is GitHubPushWebhookPayload {
  if (!isRecord(value)) {
    return false;
  }

  if (!isGitHubRepository(value.repository)) {
    return false;
  }

  if (value.after != null && typeof value.after !== "string") {
    return false;
  }

  if (value.deleted != null && typeof value.deleted !== "boolean") {
    return false;
  }

  if (value.size != null && typeof value.size !== "number") {
    return false;
  }

  if (value.commits != null) {
    return Array.isArray(value.commits);
  }

  return true;
}

type GitHubPushDraftCommit = {
  id: string;
  message: string;
};

function selectDraftCommits(
  payload: GitHubPushWebhookPayload,
): GitHubPushDraftCommit[] {
  const draftCommits: GitHubPushDraftCommit[] = [];
  const seenCommitShas = new Set<string>();

  if (Array.isArray(payload.commits)) {
    for (const commit of payload.commits) {
      if (!isValidPushCommit(commit) || seenCommitShas.has(commit.id)) {
        continue;
      }

      seenCommitShas.add(commit.id);
      draftCommits.push(commit);
    }
  }

  if (draftCommits.length > 0) {
    return draftCommits;
  }

  const fallbackCommit = selectFallbackDraftCommit(payload);
  return fallbackCommit ? [fallbackCommit] : [];
}

function selectFallbackDraftCommit(
  payload: GitHubPushWebhookPayload,
): GitHubPushDraftCommit | null {
  if (isValidPushCommit(payload.head_commit)) {
    return payload.head_commit;
  }

  const after = payload.after;
  if (typeof after !== "string" || !Array.isArray(payload.commits)) {
    return null;
  }

  const commit =
    payload.commits.find(
      (commit) => isValidPushCommit(commit) && commit.id === after,
    ) ?? null;
  if (!isValidPushCommit(commit)) {
    return null;
  }

  return commit;
}

function isValidPushCommit(
  commit: unknown,
): commit is GitHubPushDraftCommit {
  return isGitHubPushCommit(commit);
}

function isGitHubPushCommit(value: unknown): value is GitHubPushDraftCommit {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.message === "string"
  );
}

function isGitHubRepository(
  value: unknown,
): value is GitHubPushWebhookPayload["repository"] {
  return (
    isRecord(value) &&
    (typeof value.id === "string" || typeof value.id === "number")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default http;
