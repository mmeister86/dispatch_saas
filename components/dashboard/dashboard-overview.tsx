"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

type ActiveAccess = {
  email?: string;
  plan: "good" | "better";
  currentPeriodEnd: number;
  postsThisPeriod: number;
  postLimit: number;
  postsRemaining: number;
};

type AnalyticsSummary = {
  postCount: number;
  totalImpressions: number;
  totalLikes: number;
  totalEngagements: number;
  engagementRate: number;
  metricsPending: boolean;
  privateMetricsUnavailable: boolean;
};

export function DashboardOverview() {
  const access = useQuery(api.billing.currentAccess);

  if (access === undefined) {
    return (
      <DashboardGate
        actionHref="/"
        actionLabel="Checking access..."
        description="Dispatch is checking your subscription before loading workspace data."
        title="Loading dashboard."
      />
    );
  }

  if (access.state !== "active") {
    return (
      <DashboardGate
        actionHref="/"
        actionLabel={access.state === "signedOut" ? "Sign in" : "Choose a plan"}
        description={
          access.state === "signedOut"
            ? "Sign in with GitHub, choose a plan, then return here to manage your commit-to-post workspace."
            : "Your account needs an active subscription before Dispatch can show draft, repo, and X account data."
        }
        title="Subscribe before opening the dashboard."
      />
    );
  }

  return <ActiveDashboardOverview access={access} />;
}

function DashboardGate({
  actionHref,
  actionLabel,
  description,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description: string;
  title: string;
}) {
  return (
    <section className="flex min-h-[420px] items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-sm font-semibold text-emerald-700">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}

function ActiveDashboardOverview({ access }: { access: ActiveAccess }) {
  const onboardingStatus = useQuery(api.onboarding.status);
  const drafts = useQuery(api.drafts.listForReview);
  const connection = useQuery(api.github.connectedRepos);
  const xStatus = useQuery(api.x.connectionStatus);
  const analytics = useQuery(api.analytics.summary);
  const postedDrafts = (drafts ?? []).filter(
    (draft) => draft.status === "posted",
  );
  const draftCount = drafts?.filter((draft) => draft.status === "draft").length;
  const repoCount = connection?.repoCount ?? 0;

  if (onboardingStatus === undefined) {
    return (
      <DashboardGate
        actionHref="/dashboard/onboarding"
        actionLabel="Loading onboarding..."
        description="Dispatch is checking whether your first draft setup is complete."
        title="Checking onboarding."
      />
    );
  }

  if (
    onboardingStatus.state === "onboarding" &&
    !onboardingStatus.completed
  ) {
    return (
      <DashboardGate
        actionHref="/dashboard/onboarding"
        actionLabel="Complete onboarding"
        description="Teach Dispatch your writing style, import recent commits from a connected repo, and generate your first real drafts."
        title="Complete onboarding before opening the dashboard."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">
            Your commit-to-post cockpit.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Review what shipped, keep setup healthy, and watch X performance
            for posts published through Dispatch.
          </p>
        </div>
        <Link
          className="inline-flex h-10 w-fit items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          href="/dashboard/drafts"
        >
          Open drafts
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Plan" value={access.plan} />
        <MetricCard
          label="Posts remaining"
          value={String(access.postsRemaining)}
        />
        <MetricCard label="Drafts waiting" value={String(draftCount ?? "...")} />
        <MetricCard label="Repos connected" value={String(repoCount)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">
                Letzte Posts
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Published drafts from your recent commit queue.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-zinc-950 underline underline-offset-4"
              href="/dashboard/drafts"
            >
              Review drafts
            </Link>
          </div>

          {drafts === undefined ? (
            <p className="mt-5 text-sm text-zinc-500">Loading posts...</p>
          ) : postedDrafts.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {postedDrafts.slice(0, 5).map((draft) => (
                <article
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
                  key={draft._id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-zinc-950">
                        {draft.repoFullName}
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-zinc-600">
                        {draft.chosenText ?? draft.variants[0] ?? draft.commitMessage}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-zinc-500">
                      {draft.postedAt ? formatDate(draft.postedAt) : "Posted"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-950">
                No published posts yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Push to a connected repository, review a draft, then your latest
                posts will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <SetupStatus
            hasRepos={repoCount > 0}
            xConnected={xStatus?.connected ?? false}
          />
          <XPostAnalyticsCard analytics={analytics} />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold capitalize tracking-normal text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function SetupStatus({
  hasRepos,
  xConnected,
}: {
  hasRepos: boolean;
  xConnected: boolean;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold tracking-normal">Setup status</h2>
      <div className="mt-4 grid gap-3">
        <StatusRow
          actionHref="/dashboard/settings"
          actionLabel="Manage repos"
          label="GitHub repos"
          ready={hasRepos}
        />
        <StatusRow
          actionHref="/dashboard/settings"
          actionLabel="Connect X"
          label="X account"
          ready={xConnected}
        />
      </div>
    </section>
  );
}

function StatusRow({
  actionHref,
  actionLabel,
  label,
  ready,
}: {
  actionHref: string;
  actionLabel: string;
  label: string;
  ready: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 p-3">
      <div>
        <p className="text-sm font-semibold text-zinc-950">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {ready ? "Ready" : "Needs setup"}
        </p>
      </div>
      <Link
        className="text-sm font-semibold text-zinc-950 underline underline-offset-4"
        href={actionHref}
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function XPostAnalyticsCard({
  analytics,
}: {
  analytics: AnalyticsSummary | undefined;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">
            X post performance
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Metrics for posts published through Dispatch.
          </p>
        </div>
        <Link
          className="text-sm font-semibold text-zinc-950 underline underline-offset-4"
          href="/dashboard/analytics"
        >
          Details
        </Link>
      </div>
      {analytics === undefined ? (
        <p className="mt-5 text-sm text-zinc-500">Loading X metrics...</p>
      ) : analytics.postCount === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-950">
            No published posts yet.
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Post a draft to X and Dispatch will start collecting metrics.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <MiniMetric
              label="Impressions"
              value={formatNumber(analytics.totalImpressions)}
            />
            <MiniMetric label="Likes" value={formatNumber(analytics.totalLikes)} />
            <MiniMetric
              label="Engagements"
              value={formatNumber(analytics.totalEngagements)}
            />
            <MiniMetric
              label="Engagement rate"
              value={formatPercent(analytics.engagementRate)}
            />
          </div>
          {analytics.metricsPending ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Some X metrics are still pending their first refresh.
            </p>
          ) : null}
          {analytics.privateMetricsUnavailable ? (
            <p className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">
              Private X metrics are unavailable for this API access; public
              metrics are shown.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-normal text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(timestamp);
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
