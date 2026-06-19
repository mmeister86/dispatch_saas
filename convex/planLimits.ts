import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export type Plan = "good" | "better";

export function postLimitForPlan(plan: Plan) {
  return plan === "good" ? 20 : 60;
}

export function postsRemainingForPlan(plan: Plan, postsThisPeriod: number) {
  return Math.max(0, postLimitForPlan(plan) - postsThisPeriod);
}

export async function effectivePostsThisPeriodForSubscription(
  ctx: Pick<QueryCtx | MutationCtx, "db">,
  subscription: Doc<"subscriptions">,
) {
  const periodStart = monthlyPeriodStartForEnd(subscription.currentPeriodEnd);
  const postedDrafts = await ctx.db
    .query("drafts")
    .withIndex("by_userId_and_status", (q) =>
      q.eq("userId", subscription.userId).eq("status", "posted"),
    )
    .order("desc")
    .take(postLimitForPlan(subscription.plan));
  const postedThisPeriod = postedDrafts.filter(
    (draft) =>
      draft.postedAt !== undefined &&
      draft.postedAt >= periodStart &&
      draft.postedAt < subscription.currentPeriodEnd,
  ).length;

  return Math.max(subscription.postsThisPeriod, postedThisPeriod);
}

function monthlyPeriodStartForEnd(currentPeriodEnd: number) {
  const end = new Date(currentPeriodEnd);
  const start = new Date(currentPeriodEnd);
  const targetDay = end.getUTCDate();

  start.setUTCDate(1);
  start.setUTCMonth(start.getUTCMonth() - 1);

  const lastDayOfStartMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  ).getUTCDate();

  start.setUTCDate(Math.min(targetDay, lastDayOfStartMonth));

  return start.getTime();
}
