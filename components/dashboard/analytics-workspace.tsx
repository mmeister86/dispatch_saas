import { mockAnalytics } from "@/components/dashboard/mock-analytics";

export function AnalyticsWorkspace() {
  const maxValue = Math.max(...mockAnalytics.series.map((point) => point.value));

  return (
    <div className="grid gap-6">
      <header className="border-b border-zinc-200 pb-5">
        <p className="text-sm font-semibold text-emerald-700">Analytics</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">
          Directional performance preview.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Mock analytics for layout and workflow planning. Real Rybbit funnel
          and X engagement data can replace this surface later.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetric label="Window" value={mockAnalytics.windowLabel} />
        <AnalyticsMetric
          label="Impressions"
          value={mockAnalytics.impressions.toLocaleString("en")}
        />
        <AnalyticsMetric
          label="Engagement rate"
          value={mockAnalytics.engagementRate}
        />
        <AnalyticsMetric
          label="Profile visits"
          value={mockAnalytics.profileVisits.toLocaleString("en")}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">
              Mock analytics
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Best current pattern: {mockAnalytics.bestPostType}.
            </p>
          </div>
          <span className="w-fit rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
            Preview data
          </span>
        </div>
        <div className="mt-6 flex h-64 items-end gap-3">
          {mockAnalytics.series.map((point) => (
            <div className="flex flex-1 flex-col items-center gap-2" key={point.label}>
              <div
                className="w-full rounded-t-md bg-emerald-600"
                style={{ height: `${Math.max(8, (point.value / maxValue) * 100)}%` }}
              />
              <span className="text-xs font-medium text-zinc-500">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
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
