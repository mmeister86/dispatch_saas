"use client";

import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { api } from "@/convex/_generated/api";

type AnalyticsPost = {
  draftId: string;
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

export function AnalyticsWorkspace() {
  const analytics = useQuery(api.analytics.summary);

  if (analytics === undefined) {
    return (
      <div className="grid gap-6">
        <AnalyticsHeader />
        <p className="text-sm text-zinc-500">Loading X post metrics...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AnalyticsHeader />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetric label="Window" value={analytics.windowLabel} />
        <AnalyticsMetric
          label="Impressions"
          value={formatNumber(analytics.totalImpressions)}
        />
        <AnalyticsMetric
          label="Engagement rate"
          value={formatPercent(analytics.engagementRate)}
        />
        <AnalyticsMetric
          label="Profile visits"
          value={formatNumber(totalProfileVisits(analytics.recentPosts))}
        />
      </section>

      {analytics.privateMetricsUnavailable ? (
        <Notice>
          Private X metrics are unavailable for this API access. Dispatch is
          showing public metrics where X allows them.
        </Notice>
      ) : null}

      {analytics.metricsPending ? (
        <Notice>
          Some posts are waiting for their first X analytics refresh.
        </Notice>
      ) : null}

      {analytics.postCount === 0 ? (
        <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-normal text-zinc-950">
            No published posts yet.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Publish a draft to X from Dispatch and this dashboard will start
            tracking its public performance and any private metrics your X API
            access allows.
          </p>
        </section>
      ) : (
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">
                Dispatch-published posts
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Latest captured X metrics for posts created from your drafts.
              </p>
            </div>
            <span className="w-fit rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
              {analytics.snapshotCount} refreshed
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {analytics.recentPosts.map((post) => (
              <PostAnalyticsRow key={post.draftId} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AnalyticsHeader() {
  return (
    <header className="border-b border-zinc-200 pb-5">
      <p className="text-sm font-semibold text-emerald-700">Analytics</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-normal">
        X post performance.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
        Metrics for posts published through Dispatch. Rybbit remains reserved
        for product funnel tracking.
      </p>
    </header>
  );
}

function PostAnalyticsRow({ post }: { post: AnalyticsPost }) {
  const engagementCount =
    post.engagements ??
    (post.likeCount ?? 0) +
      (post.replyCount ?? 0) +
      (post.retweetCount ?? 0) +
      (post.quoteCount ?? 0);

  return (
    <article className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-semibold text-zinc-950">
              {post.repoFullName}
            </p>
            {post.metricsAccess === "public_only" ? (
              <span className="rounded bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                Public metrics
              </span>
            ) : null}
          </div>
          <p className="mt-1 break-words text-sm leading-6 text-zinc-600">
            {post.text}
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500">
            Posted {formatDate(post.postedAt)}
            {post.capturedAt ? ` · refreshed ${formatDate(post.capturedAt)}` : ""}
          </p>
        </div>
        <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-md">
          <CompactMetric
            label="Impr."
            value={metricValue(post.impressionCount)}
          />
          <CompactMetric label="Likes" value={metricValue(post.likeCount)} />
          <CompactMetric label="Replies" value={metricValue(post.replyCount)} />
          <CompactMetric label="Eng." value={formatNumber(engagementCount)} />
        </div>
      </div>
    </article>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
      {children}
    </p>
  );
}

function AnalyticsMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 text-right">
      <p className="text-[11px] font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tracking-normal text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function metricValue(value: number | undefined) {
  return value === undefined ? "0" : formatNumber(value);
}

function totalProfileVisits(posts: AnalyticsPost[]) {
  return posts.reduce((total, post) => total + (post.userProfileClicks ?? 0), 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(timestamp);
}
