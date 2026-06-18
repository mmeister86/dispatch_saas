import { httpRouter } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { env, httpAction, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

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

    // Push handling lands in TASK-12 / T-014.
    return new Response("OK", { status: 200 });
  }),
});

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
      await ctx.db.replace(existing._id, {
        userId: args.userId,
        lemonCustomerId: args.lemonCustomerId,
        lemonSubscriptionId: args.lemonSubscriptionId,
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        postsThisPeriod: existing.postsThisPeriod,
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

export default http;
