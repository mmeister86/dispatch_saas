import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, env, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Plan = "good" | "better";

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
            enabled_variants: [Number(variantId)],
            redirect_url: env.APP_URL,
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
    throw new Error(`Lemon Squeezy checkout failed: ${response.status}`);
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
