"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Metric = {
  label: string;
  value: number;
  detail?: string;
};

export function AdminOverview() {
  const overview = useQuery(api.admin.overview);

  if (overview === undefined) {
    return (
      <AdminFrame>
        <AccessPanel
          eyebrow="Admin"
          title="Loading admin metrics."
          description="Dispatch is checking your account before loading operational data."
        />
      </AdminFrame>
    );
  }

  if (overview.state === "signedOut") {
    return (
      <AdminFrame>
        <AccessPanel
          eyebrow="Admin"
          title="Sign in to view admin metrics"
          description="Use the owner account configured in Convex to open this dashboard."
          action={
            <SignInButton mode="modal">
              <button type="button">Sign in</button>
            </SignInButton>
          }
        />
      </AdminFrame>
    );
  }

  if (overview.state === "forbidden") {
    return (
      <AdminFrame>
        <AccessPanel
          eyebrow="Admin"
          title="You do not have access to this admin dashboard"
          description="This route is restricted to the email address configured in Convex ADMIN_EMAIL."
        />
      </AdminFrame>
    );
  }

  const totals: Metric[] = [
    { label: "Total users", value: overview.totals.users },
    { label: "Connected repos", value: overview.totals.connectedRepos },
    { label: "X-connected users", value: overview.totals.xConnectedUsers },
    {
      label: "Active subscriptions",
      value: overview.totals.activeSubscriptions,
    },
    { label: "Drafts total", value: overview.totals.draftsTotal },
    { label: "Draft drafts", value: overview.totals.draftsDraft },
    { label: "Drafts posted", value: overview.totals.draftsPosted },
    { label: "Drafts discarded", value: overview.totals.draftsDiscarded },
    { label: "X posts posted", value: overview.totals.xPostsPosted },
  ];
  const last30Days: Metric[] = [
    { label: "New users", value: overview.last30Days.newUsers },
    { label: "New repos", value: overview.last30Days.newRepos },
    {
      label: "New active subscriptions",
      value: overview.last30Days.newActiveSubscriptions,
    },
    {
      label: "X users connected",
      value: overview.last30Days.xUsersConnected,
    },
    { label: "Drafts created", value: overview.last30Days.draftsCreated },
    { label: "X posts posted", value: overview.last30Days.xPostsPosted },
  ];

  return (
    <AdminFrame>
      <div className="grid gap-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">
              Dispatch operations overview.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              A read-only view of account setup, draft creation, repository
              connections, and posts sent to X.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="text-right">
              <p className="text-xs font-medium text-zinc-500">Generated</p>
              <p className="text-sm font-semibold text-zinc-950">
                {formatDateTime(overview.generatedAt)}
              </p>
            </div>
            <UserButton />
          </div>
        </header>

        <MetricSection
          description={`Exact until the first ${overview.maxRowsPerTable} rows per table; beyond that, treat this as a bounded launch snapshot.`}
          title="Launch snapshot"
          metrics={totals}
        />
        <MetricSection title="Last 30 days" metrics={last30Days} />

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-zinc-950">
                Recent activity
              </h2>
              <p className="text-sm text-zinc-600">
                Latest posted drafts with X post IDs.
              </p>
            </div>
            <p className="text-xs font-medium text-zinc-500">
              Bounded to {overview.maxRowsPerTable} rows per table
            </p>
          </div>

          {overview.recentActivity.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {overview.recentActivity.map((activity) => (
                <article
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
                  key={activity.draftId}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-zinc-950">
                        {activity.repoFullName}
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-zinc-600">
                        {activity.preview}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-xs font-medium text-zinc-500">
                        {formatDateTime(activity.postedAt)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-zinc-700">
                        {activity.xPostId}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-950">
                No posted X activity yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Posted drafts will appear here once users publish to X.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminFrame>
  );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

function AccessPanel({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="flex min-h-[420px] items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-sm font-semibold text-emerald-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
        {action ? (
          <div className="mt-5 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 [&_button]:font-semibold">
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MetricSection({
  description,
  metrics,
  title,
}: {
  description?: string;
  metrics: Metric[];
  title: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-normal text-zinc-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
          {description}
        </p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={`${title}-${metric.label}`} metric={metric} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
        {metric.value.toLocaleString("en")}
      </p>
      {metric.detail ? (
        <p className="mt-1 text-xs font-medium text-zinc-500">
          {metric.detail}
        </p>
      ) : null}
    </article>
  );
}

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}
