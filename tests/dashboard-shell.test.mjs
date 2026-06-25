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

test("/dashboard renders the canonical shadcn sidebar app shell", async () => {
  assert.equal(await pathExists("app/dashboard/layout.tsx"), true);
  assert.equal(await pathExists("app/dashboard/page.tsx"), true);
  assert.equal(await pathExists("components/dashboard/app-sidebar.tsx"), true);
  assert.equal(await pathExists("components/ui/sidebar.tsx"), true);

  const layoutSource = await read("app/dashboard/layout.tsx");
  const shellSource = await read("components/dashboard/dashboard-shell.tsx");
  const sidebarSource = await read("components/dashboard/app-sidebar.tsx");
  const sidebarPrimitiveSource = await read("components/ui/sidebar.tsx");

  assert.match(layoutSource, /DashboardShell/);
  assert.match(shellSource, /SidebarProvider/);
  assert.match(shellSource, /SidebarInset/);
  assert.match(sidebarPrimitiveSource, /export function SidebarProvider/);
  assert.match(sidebarPrimitiveSource, /export function SidebarInset/);
  assert.match(sidebarPrimitiveSource, /export function Sidebar/);
  assert.match(sidebarPrimitiveSource, /md:sticky/);
  assert.match(sidebarPrimitiveSource, /md:top-0/);
  assert.match(sidebarPrimitiveSource, /md:h-screen/);
  assert.match(sidebarSource, /collapsible="none"/);
  assert.doesNotMatch(sidebarSource, /md:h-auto/);
  assert.match(sidebarSource, /Dashboard/);
  assert.match(sidebarSource, /Analytics/);
  assert.match(sidebarSource, /Drafts/);
  assert.match(sidebarSource, /Settings/);
  assert.doesNotMatch(sidebarSource, /label: "Billing"|href: "\/dashboard\/billing"/);
  assert.match(sidebarSource, /Drafts[\s\S]*\/dashboard\/settings/);
  assert.doesNotMatch(sidebarSource, /NavSecondary/);
  assert.doesNotMatch(sidebarSource, /Secondary/);
  assert.match(sidebarSource, /UserButton/);
  assert.match(sidebarSource, /postsRemaining/);
  assert.match(sidebarSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(sidebarSource, /"block rounded-md text-white"/);
  assert.match(sidebarSource, /"block rounded-md text-zinc-700 hover:text-zinc-950"/);
  assert.match(sidebarPrimitiveSource, /text-current/);
});

test("dashboard overview derives status from existing Convex data and real X analytics", async () => {
  assert.equal(await pathExists("components/dashboard/dashboard-overview.tsx"), true);

  const overviewSource = await read("components/dashboard/dashboard-overview.tsx");

  assert.match(overviewSource, /api\.billing\.currentAccess/);
  assert.match(overviewSource, /api\.drafts\.listForReview/);
  assert.match(overviewSource, /api\.github\.connectedRepos/);
  assert.match(overviewSource, /api\.x\.connectionStatus/);
  assert.match(overviewSource, /api\.analytics\.summary/);
  assert.match(overviewSource, /status === "posted"/);
  assert.match(overviewSource, /Letzte Posts/);
  assert.match(overviewSource, /X post performance/);
  assert.match(overviewSource, /\/dashboard\/settings/);
  assert.match(overviewSource, /\/dashboard\/drafts/);
  assert.doesNotMatch(overviewSource, /mockAnalytics|MockAnalyticsCard/);
});

test("dashboard overview gates paid workflow queries behind active access", async () => {
  const overviewSource = await read("components/dashboard/dashboard-overview.tsx");
  const outerSource = overviewSource.slice(
    overviewSource.indexOf("export function DashboardOverview"),
    overviewSource.indexOf("function ActiveDashboardOverview"),
  );
  const activeSource = overviewSource.slice(
    overviewSource.indexOf("function ActiveDashboardOverview"),
    overviewSource.indexOf("function MetricCard"),
  );

  assert.match(outerSource, /api\.billing\.currentAccess/);
  assert.match(outerSource, /access\.state !== "active"/);
  assert.match(outerSource, /<ActiveDashboardOverview access=\{access\}/);
  assert.doesNotMatch(outerSource, /api\.drafts\.listForReview/);
  assert.doesNotMatch(outerSource, /api\.github\.connectedRepos/);
  assert.doesNotMatch(outerSource, /api\.x\.connectionStatus/);
  assert.doesNotMatch(outerSource, /api\.analytics\.summary/);
  assert.match(activeSource, /api\.drafts\.listForReview/);
  assert.match(activeSource, /api\.github\.connectedRepos/);
  assert.match(activeSource, /api\.x\.connectionStatus/);
  assert.match(activeSource, /api\.analytics\.summary/);
});

test("dashboard subroutes host drafts, analytics, and settings workflows while billing redirects", async () => {
  for (const route of ["analytics", "drafts", "billing", "settings"]) {
    assert.equal(await pathExists(`app/dashboard/${route}/page.tsx`), true);
  }

  const draftsPage = await read("app/dashboard/drafts/page.tsx");
  const billingPage = await read("app/dashboard/billing/page.tsx");
  const settingsPage = await read("app/dashboard/settings/page.tsx");
  const analyticsPage = await read("app/dashboard/analytics/page.tsx");
  const draftsWorkspace = await read("components/drafts-workspace.tsx");
  const settingsWorkspace = await read("components/settings-workspace.tsx");

  assert.match(draftsPage, /DraftsWorkspace/);
  assert.match(draftsPage, /embedded/);
  assert.match(billingPage, /redirect\("\/dashboard\/settings"\)/);
  assert.match(settingsPage, /SettingsWorkspace/);
  assert.match(settingsPage, /embedded/);
  assert.match(analyticsPage, /AnalyticsWorkspace/);
  assert.match(draftsWorkspace, /embedded\?: boolean/);
  assert.match(settingsWorkspace, /embedded\?: boolean/);
  assert.match(settingsWorkspace, /XAccountPanel/);
  assert.match(settingsWorkspace, /GitHubRepoPanel/);
  assert.match(settingsWorkspace, /BillingPortalPanel access=\{access\}/);
});

test("legacy drafts and settings routes redirect to dashboard canonical routes", async () => {
  const draftsPage = await read("app/drafts/page.tsx");
  const settingsPage = await read("app/settings/page.tsx");

  assert.match(draftsPage, /redirect\("\/dashboard\/drafts"\)/);
  assert.match(settingsPage, /searchParams/);
  assert.match(settingsPage, /URLSearchParams/);
  assert.match(settingsPage, /redirect\(`\/dashboard\/settings\?\$\{query\}`\)/);
});

test("home routes active subscribers into the dashboard instead of old workspaces", async () => {
  const homeSource = await read("app/page.tsx");

  assert.match(homeSource, /href="\/dashboard"/);
  assert.match(homeSource, /Open dashboard/);
  assert.doesNotMatch(homeSource, /href="\/drafts"/);
  assert.doesNotMatch(homeSource, /href="\/settings"/);
});

test("non-active dashboard workspace gates return users to the root paywall", async () => {
  const draftsSource = await read("components/drafts-workspace.tsx");
  const settingsSource = await read("components/settings-workspace.tsx");

  const draftsGate = draftsSource.slice(
    draftsSource.indexOf("if (access.state !== \"active\")"),
    draftsSource.indexOf("return <ActiveDraftsWorkspace"),
  );
  const settingsGate = settingsSource.slice(
    settingsSource.indexOf("function SettingsGate"),
    settingsSource.indexOf("function ActiveSettingsWorkspace"),
  );
  const billingGate = settingsSource.slice(
    settingsSource.indexOf("export function BillingWorkspace"),
    settingsSource.indexOf("function BillingPortalPanel"),
  );

  assert.match(draftsGate, /href="\/"/);
  assert.match(settingsGate, /href="\/"/);
  assert.match(billingGate, /href="\/"/);
});
