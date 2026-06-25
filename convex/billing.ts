import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  env,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import {
  effectivePostsThisPeriodForSubscription,
  postLimitForPlan,
  postsRemainingForPlan,
} from "./planLimits";
import type { Id } from "./_generated/dataModel";
import type { Plan } from "./planLimits";
import type { QueryCtx } from "./_generated/server";

export const currentAccess = query({
  args: {},
  returns: v.union(
    v.object({
      state: v.literal("signedOut"),
    }),
    v.object({
      state: v.literal("needsSubscription"),
      email: v.optional(v.string()),
    }),
    v.object({
      state: v.literal("active"),
      email: v.optional(v.string()),
      plan: v.union(v.literal("good"), v.literal("better")),
      currentPeriodEnd: v.number(),
      postsThisPeriod: v.number(),
      postLimit: v.number(),
      postsRemaining: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      return { state: "signedOut" as const };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkTokenIdentifier", (q) =>
        q.eq("clerkTokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user === null) {
      return {
        state: "needsSubscription" as const,
        ...(identity.email ? { email: identity.email } : {}),
      };
    }

    const subscription = await getActiveSubscription(ctx, user._id);

    if (!subscription) {
      return {
        state: "needsSubscription" as const,
        email: user.email,
      };
    }

    const effectivePostsThisPeriod =
      await effectivePostsThisPeriodForSubscription(ctx, subscription);
    const postLimit = postLimitForPlan(subscription.plan);

    return {
      state: "active" as const,
      email: user.email,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd,
      postsThisPeriod: effectivePostsThisPeriod,
      postLimit,
      postsRemaining: postsRemainingForPlan(
        subscription.plan,
        effectivePostsThisPeriod,
      ),
    };
  },
});

export const createCheckout = action({
  args: {
    plan: v.union(v.literal("good"), v.literal("better")),
  },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("You must be signed in to start checkout.");
    }

    if (!identity.email) {
      throw new Error("Your account needs an email address before checkout.");
    }

    const userId: Id<"users"> = await ctx.runMutation(
      internal.billing.ensureCheckoutUser,
      {
        clerkTokenIdentifier: identity.tokenIdentifier,
        email: identity.email,
      },
    );
    const hasActiveSubscription: boolean = await ctx.runQuery(
      internal.billing.hasActiveSubscriptionForUser,
      { userId },
    );

    if (hasActiveSubscription) {
      throw new Error("This account already has an active Dispatch subscription.");
    }

    const variantId = getVariantId(args.plan);
    const checkout = await createLemonCheckout({
      plan: args.plan,
      userId,
      variantId,
      email: identity.email,
    });

    return { url: checkout.url };
  },
});

export const createBillingPortal = action({
  args: {},
  returns: v.object({ url: v.string() }),
  handler: async (ctx): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("You must be signed in to manage billing.");
    }

    const subscription: { lemonSubscriptionId: string } | null =
      await ctx.runQuery(internal.billing.activeSubscriptionForBillingPortal, {
        clerkTokenIdentifier: identity.tokenIdentifier,
      });

    if (subscription === null) {
      throw new Error("Subscribe before managing billing.");
    }

    return await createLemonBillingPortal(subscription.lemonSubscriptionId);
  },
});

export const activeSubscriptionForBillingPortal = internalQuery({
  args: {
    clerkTokenIdentifier: v.string(),
  },
  returns: v.union(
    v.object({
      lemonSubscriptionId: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkTokenIdentifier", (q) =>
        q.eq("clerkTokenIdentifier", args.clerkTokenIdentifier),
      )
      .unique();

    if (user === null) {
      return null;
    }

    const subscription = await getActiveSubscription(ctx, user._id);

    if (subscription === null) {
      return null;
    }

    return {
      lemonSubscriptionId: subscription.lemonSubscriptionId,
    };
  },
});

export const hasActiveSubscriptionForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return (await getActiveSubscription(ctx, args.userId)) !== null;
  },
});

export const ensureCheckoutUser = internalMutation({
  args: {
    clerkTokenIdentifier: v.string(),
    email: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkTokenIdentifier", (q) =>
        q.eq("clerkTokenIdentifier", args.clerkTokenIdentifier),
      )
      .unique();

    if (existing !== null) {
      if (existing.email !== args.email) {
        await ctx.db.patch(existing._id, { email: args.email });
      }

      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkTokenIdentifier: args.clerkTokenIdentifier,
      email: args.email,
    });
  },
});

async function getActiveSubscription(ctx: QueryCtx, userId: Id<"users">) {
  const now = Date.now();
  const activeSubscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId_and_status_and_currentPeriodEnd", (q) =>
      q
        .eq("userId", userId)
        .eq("status", "active")
        .gt("currentPeriodEnd", now),
    )
    .take(1);

  return activeSubscriptions[0] ?? null;
}

function getVariantId(plan: Plan) {
  return plan === "good"
    ? env.LEMONSQUEEZY_GOOD_VARIANT_ID
    : env.LEMONSQUEEZY_BETTER_VARIANT_ID;
}

async function createLemonCheckout({
  plan,
  userId,
  variantId,
  email,
}: {
  plan: Plan;
  userId: Id<"users">;
  variantId: string;
  email: string;
}) {
  const checkoutRedirectUrl = new URL("/dashboard", env.APP_URL);
  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          checkout_data: {
            email,
            custom: {
              userId,
              plan,
            },
          },
          product_options: {
            redirect_url: checkoutRedirectUrl.toString(),
            receipt_button_text: "Go to Dispatch",
            receipt_thank_you_note:
              "Thanks for subscribing. Your first Dispatch draft is waiting.",
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: env.LEMONSQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Lemon Squeezy checkout failed: ${response.status} ${responseBody}`,
    );
  }

  const payload = (await response.json()) as {
    data?: { attributes?: { url?: unknown } };
  };
  const url = payload.data?.attributes?.url;

  if (typeof url !== "string" || url.length === 0) {
    throw new Error("Lemon Squeezy did not return a checkout URL.");
  }

  return { url };
}

async function createLemonBillingPortal(subscriptionId: string) {
  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      },
    },
  );

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Lemon Squeezy billing portal failed: ${response.status} ${responseBody}`,
    );
  }

  const payload = (await response.json()) as {
    data?: {
      attributes?: {
        urls?: {
          customer_portal_update_subscription?: unknown;
          customer_portal?: unknown;
        };
      };
    };
  };
  const url =
    payload.data?.attributes?.urls?.customer_portal_update_subscription ??
    payload.data?.attributes?.urls?.customer_portal;

  if (typeof url !== "string" || url.length === 0) {
    throw new Error("Lemon Squeezy did not return a billing portal URL.");
  }

  return { url };
}
