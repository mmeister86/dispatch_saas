import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

async function read(path) {
  return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function pathExists(path) {
  try {
    await access(new URL(`../${path}`, import.meta.url), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

test("schema stores X analytics refresh state and metric snapshots separately", async () => {
  const source = await read("convex/schema.ts");

  assert.match(source, /xPostMetricRefreshes:\s*defineTable\(\{/);
  assert.match(source, /draftId:\s*v\.id\("drafts"\)/);
  assert.match(source, /xPostId:\s*v\.string\(\)/);
  assert.match(source, /nextRefreshAt:\s*v\.number\(\)/);
  assert.match(source, /failureCount:\s*v\.number\(\)/);
  assert.match(source, /metricsAccess:\s*v\.optional\(\s*v\.union\(\s*v\.literal\("full"\),\s*v\.literal\("public_only"\)\s*\)\s*\)/s);
  assert.match(source, /\.index\("by_userId_and_draftId",\s*\["userId",\s*"draftId"\]\)/);
  assert.match(source, /\.index\("by_nextRefreshAt",\s*\["nextRefreshAt"\]\)/);

  assert.match(source, /xPostMetricSnapshots:\s*defineTable\(\{/);
  assert.match(source, /likeCount:\s*v\.number\(\)/);
  assert.match(source, /replyCount:\s*v\.number\(\)/);
  assert.match(source, /retweetCount:\s*v\.number\(\)/);
  assert.match(source, /quoteCount:\s*v\.number\(\)/);
  assert.match(source, /impressionCount:\s*v\.optional\(v\.number\(\)\)/);
  assert.match(source, /urlLinkClicks:\s*v\.optional\(v\.number\(\)\)/);
  assert.match(source, /userProfileClicks:\s*v\.optional\(v\.number\(\)\)/);
  assert.match(source, /engagements:\s*v\.optional\(v\.number\(\)\)/);
  assert.match(source, /\.index\("by_userId_and_capturedAt",\s*\["userId",\s*"capturedAt"\]\)/);
  assert.match(source, /\.index\("by_draftId_and_capturedAt",\s*\["draftId",\s*"capturedAt"\]\)/);
});

test("analytics backend exposes authenticated summaries and internal refresh workflow", async () => {
  assert.equal(await pathExists("convex/analytics.ts"), true);

  const source = await read("convex/analytics.ts");

  assert.match(source, /export const summary = query\(\{/);
  assert.match(source, /ctx\.auth\.getUserIdentity\(\)/);
  assert.match(source, /identity\.tokenIdentifier/);
  assert.match(source, /withIndex\("by_clerkTokenIdentifier"/);
  assert.match(source, /withIndex\("by_userId_and_capturedAt"/);
  assert.match(source, /\.take\(100\)/);
  assert.match(source, /metricsPending/);
  assert.match(source, /privateMetricsUnavailable/);
  assert.doesNotMatch(source, /xAccessToken|xRefreshToken/);

  assert.match(source, /export const enqueuePostMetrics = internalMutation\(\{/);
  assert.match(source, /export const dueRefreshes = internalQuery\(\{/);
  assert.match(source, /export const recordMetricSnapshot = internalMutation\(\{/);
  assert.match(source, /export const refreshDuePostMetrics = internalAction\(\{/);
  assert.match(source, /fetchXPostMetrics\(\{/);
  assert.match(source, /nextRefreshAtForPost\(/);
  assert.match(source, /MAX_REFRESH_FAILURES/);
  assert.match(source, /withIndex\("by_nextRefreshAt"/);
});

test("X API helper fetches full post metrics and safely falls back to public metrics", async () => {
  const source = await read("convex/xApi.ts");

  assert.match(source, /const X_POST_LOOKUP_URL = "https:\/\/api\.x\.com\/2\/tweets"/);
  assert.match(source, /export async function fetchXPostMetrics/);
  assert.match(source, /tweet\.fields/);
  assert.match(source, /public_metrics,non_public_metrics,organic_metrics/);
  assert.match(source, /public_metrics/);
  assert.match(source, /metricsAccess:\s*"full"/);
  assert.match(source, /metricsAccess:\s*"public_only"/);
  assert.match(source, /impression_count/);
  assert.match(source, /url_link_clicks/);
  assert.match(source, /user_profile_clicks/);
  assert.match(source, /engagements/);
  assert.doesNotMatch(source, /throw new Error\(await response\.text\(\)\)/);
});

test("posting and cron wiring enqueue and refresh X post analytics internally", async () => {
  assert.equal(await pathExists("convex/crons.ts"), true);

  const xSource = await read("convex/x.ts");
  const cronsSource = await read("convex/crons.ts");

  assert.match(xSource, /internal\.analytics\.enqueuePostMetrics/);
  assert.match(xSource, /draftId:\s*args\.draftId/);
  assert.match(xSource, /xPostId:\s*post\.xPostId|xPostId:\s*args\.xPostId/);
  assert.match(xSource, /postedAt/);

  assert.match(cronsSource, /cronJobs\(\)/);
  assert.match(cronsSource, /crons\.interval\(/);
  assert.match(cronsSource, /"refresh X post analytics"/);
  assert.match(cronsSource, /\{\s*minutes:\s*15\s*\}/);
  assert.match(cronsSource, /internal\.analytics\.refreshDuePostMetrics/);
});

test("dashboard analytics surfaces use Convex analytics instead of mock analytics", async () => {
  const overviewSource = await read("components/dashboard/dashboard-overview.tsx");
  const analyticsSource = await read("components/dashboard/analytics-workspace.tsx");

  assert.match(overviewSource, /api\.analytics\.summary/);
  assert.match(analyticsSource, /api\.analytics\.summary/);
  assert.doesNotMatch(overviewSource, /mockAnalytics|MockAnalyticsCard/);
  assert.doesNotMatch(analyticsSource, /mockAnalytics|Mock analytics/);
  assert.match(overviewSource, /metricsPending/);
  assert.match(analyticsSource, /privateMetricsUnavailable/);
  assert.match(analyticsSource, /No published posts yet/);
  assert.match(analyticsSource, /return value === undefined \? "0" : formatNumber\(value\)/);
  assert.doesNotMatch(analyticsSource, /"Pending"/);
});
