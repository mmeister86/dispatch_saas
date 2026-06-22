"use client";

import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";

type RepositoryOption = {
  githubRepoId: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
};

type ConnectedRepository = RepositoryOption & {
  connectedAt: number;
  githubInstallationId: string;
};

type PendingSelection = {
  installationId: string;
  repositories: RepositoryOption[];
};

type ActiveAccess = {
  email?: string;
  plan: "good" | "better";
  currentPeriodEnd: number;
  postsThisPeriod: number;
  postLimit: number;
  postsRemaining: number;
};

export function SettingsWorkspace() {
  const { user } = useUser();
  const access = useQuery(api.billing.currentAccess);

  if (access === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-black">
        <p className="text-sm font-medium text-zinc-500">
          Loading settings...
        </p>
      </main>
    );
  }

  if (access.state !== "active") {
    const email =
      access.state === "needsSubscription"
        ? access.email ??
          user?.primaryEmailAddress?.emailAddress ??
          user?.fullName ??
          "Signed in"
        : "Signed out";

    return <SettingsGate email={email} isSignedOut={access.state === "signedOut"} />;
  }

  return <ActiveSettingsWorkspace access={access} />;
}

function SettingsGate({
  email,
  isSignedOut,
}: {
  email: string;
  isSignedOut: boolean;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-12 text-black">
      <section className="w-full max-w-lg border border-black/10 p-6">
        <p className="text-sm font-medium text-emerald-700">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Subscribe before managing Dispatch.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-700">
          {isSignedOut
            ? "Sign in with GitHub, choose a plan, then return here to manage repos and billing."
            : `${email} still needs an active plan before settings are available.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {isSignedOut ? (
            <SignInButton mode="modal">
              <button className="h-10 border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                Sign in with GitHub
              </button>
            </SignInButton>
          ) : null}
          <Link
            className="inline-flex h-10 items-center border border-black/20 px-4 text-sm font-medium transition-colors hover:bg-zinc-100"
            href="/"
          >
            Back to workspace
          </Link>
        </div>
      </section>
    </main>
  );
}

function ActiveSettingsWorkspace({ access }: { access: ActiveAccess }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-12 text-black">
      <section className="flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Dispatch</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Settings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
              Manage the repository Dispatch watches and your billing portal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex h-9 items-center border border-black/20 px-3 text-sm font-medium transition-colors hover:bg-zinc-100"
              href="/drafts"
            >
              Drafts
            </Link>
            <Link
              className="inline-flex h-9 items-center border border-black/20 px-3 text-sm font-medium transition-colors hover:bg-zinc-100"
              href="/"
            >
              Home
            </Link>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </header>

        <BillingPortalPanel access={access} />
        <GitHubRepoPanel />
      </section>
    </main>
  );
}

function BillingPortalPanel({ access }: { access: ActiveAccess }) {
  const createBillingPortal = useAction(api.billing.createBillingPortal);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenPortal() {
    setIsOpeningPortal(true);
    setError(null);

    try {
      const portal = await createBillingPortal({});
      window.location.assign(portal.url);
    } catch (err) {
      setError(errorMessage(err, "Billing portal failed. Try again."));
      setIsOpeningPortal(false);
    }
  }

  return (
    <section className="border border-black/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Subscription</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            Manage billing
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Open Lemon Squeezy to update payment details, invoices, and your
            subscription.
          </p>
        </div>
        <button
          className="h-10 w-fit border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isOpeningPortal}
          onClick={() => void handleOpenPortal()}
          type="button"
        >
          {isOpeningPortal ? "Opening..." : "Open billing portal"}
        </button>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
        <div className="border border-black/10 p-3">
          <dt className="font-medium text-zinc-500">Plan</dt>
          <dd className="mt-1 capitalize">{access.plan}</dd>
        </div>
        <div className="border border-black/10 p-3">
          <dt className="font-medium text-zinc-500">Posts used</dt>
          <dd className="mt-1">
            {access.postsThisPeriod}/{access.postLimit}
          </dd>
        </div>
        <div className="border border-black/10 p-3">
          <dt className="font-medium text-zinc-500">Remaining</dt>
          <dd className="mt-1">{access.postsRemaining}</dd>
        </div>
        <div className="border border-black/10 p-3">
          <dt className="font-medium text-zinc-500">Renews</dt>
          <dd className="mt-1">{formatDate(access.currentPeriodEnd)}</dd>
        </div>
      </dl>

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">Billing needs attention.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}
    </section>
  );
}

function GitHubRepoPanel() {
  const connection = useQuery(api.github.connectedRepos);
  const completeInstallation = useAction(api.github.completeInstallation);
  const connectInstalledRepository = useAction(
    api.github.connectInstalledRepository,
  );
  const installedRepositoryOptions = useAction(
    api.github.installedRepositoryOptions,
  );
  const disconnectRepo = useMutation(api.github.disconnectRepo);
  const processedInstallationId = useRef<string | null>(null);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);
  const [isCompletingInstallation, setIsCompletingInstallation] =
    useState(false);
  const [connectingRepoId, setConnectingRepoId] = useState<string | null>(null);
  const [isChoosingInstalledRepos, setIsChoosingInstalledRepos] =
    useState(false);
  const [disconnectingRepoId, setDisconnectingRepoId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");

    if (!installationId || processedInstallationId.current === installationId) {
      return;
    }

    processedInstallationId.current = installationId;
    setIsCompletingInstallation(true);
    setNotice(null);
    setError(null);

    void completeInstallation({ installationId })
      .then((result) => {
        if (result.kind === "selectionRequired") {
          setPendingSelection({
            installationId,
            repositories: result.repositories,
          });
          return;
        }

        setPendingSelection(null);
        setNotice(`${result.repo.fullName} is connected.`);
        clearInstallationQueryParams();
      })
      .catch((err) => {
        setError(errorMessage(err));
      })
      .finally(() => {
        setIsCompletingInstallation(false);
      });
  }, [completeInstallation]);

  async function handleConnectInstalledRepository(githubRepoId: string) {
    if (pendingSelection === null) {
      return;
    }

    setConnectingRepoId(githubRepoId);
    setNotice(null);
    setError(null);

    try {
      const result = await connectInstalledRepository({
        installationId: pendingSelection.installationId,
        githubRepoId,
      });
      setPendingSelection(null);
      setNotice(`${result.repo.fullName} is connected.`);
      clearInstallationQueryParams();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setConnectingRepoId(null);
    }
  }

  async function handleChooseInstalledRepo() {
    setIsChoosingInstalledRepos(true);
    setNotice(null);
    setError(null);

    try {
      const result = await installedRepositoryOptions({});
      setPendingSelection({
        installationId: result.installationId,
        repositories: result.repositories,
      });
    } catch (err) {
      setError(errorMessage(err, "Loading installed repositories failed."));
    } finally {
      setIsChoosingInstalledRepos(false);
    }
  }

  async function handleDisconnect(githubRepoId: string, fullName: string) {
    setDisconnectingRepoId(githubRepoId);
    setNotice(null);
    setError(null);

    try {
      const result = await disconnectRepo({ githubRepoId });

      if (!result.disconnected) {
        throw new Error("That repository is no longer connected.");
      }

      setNotice(`${fullName} is disconnected from Dispatch.`);
    } catch (err) {
      setError(errorMessage(err, "Disconnect failed. Try again."));
    } finally {
      setDisconnectingRepoId(null);
    }
  }

  const repoCount = connection?.repoCount ?? 0;
  const repoLimit = connection?.repoLimit ?? 0;
  const canConnectMore = connection?.canConnectMore ?? false;
  const installUrl = connection?.installUrl ?? "";
  const repos = connection?.repos ?? [];
  const isOverRepoLimit = repoCount > repoLimit;
  const canOpenInstallUrl =
    connection !== undefined &&
    connection !== null &&
    canConnectMore &&
    !isCompletingInstallation &&
    installUrl.length > 0;
  const canChooseInstalledRepo =
    connection !== undefined &&
    connection !== null &&
    connection.hasGitHubInstallation &&
    canConnectMore &&
    !isCompletingInstallation;

  return (
    <section className="border border-black/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">GitHub repo</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            Manage connected repos
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Dispatch watches selected repositories through the GitHub App push
            webhook. Disconnecting only removes the Dispatch connection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canChooseInstalledRepo ? (
            <button
              className="h-10 w-fit border border-black/20 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChoosingInstalledRepos}
              onClick={() => void handleChooseInstalledRepo()}
              type="button"
            >
              {isChoosingInstalledRepos
                ? "Loading..."
                : "Choose installed repo"}
            </button>
          ) : null}
          {canOpenInstallUrl ? (
            <a
              className="flex h-10 w-fit items-center border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              href={installUrl}
            >
              Install GitHub App
            </a>
          ) : (
            <button
              className="h-10 w-fit border border-black bg-black px-4 text-sm font-medium text-white opacity-60 disabled:cursor-not-allowed"
              disabled
              type="button"
            >
              {isCompletingInstallation
                ? "Connecting..."
                : "Install GitHub App"}
            </button>
          )}
        </div>
      </div>

      {connection === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">
          Checking connected repos...
        </p>
      ) : connection ? (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-2 border border-black/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-zinc-900">
                {repoCount}/{repoLimit} repos connected
              </p>
              <p className="mt-1 text-zinc-600">
                {connection.plan === "good"
                  ? "Good includes 1 connected repo."
                  : "Better includes up to 5 connected repos."}
              </p>
            </div>
            {!canConnectMore && connection.plan === "good" ? (
              <p className="text-sm font-medium text-zinc-900">
                Upgrade to Better to connect more repos.
              </p>
            ) : null}
            {isOverRepoLimit ? (
              <p className="text-sm font-medium text-zinc-900">
                Disconnect extra repos to return to your current plan limit.
              </p>
            ) : null}
          </div>

          {repos.length > 0 ? (
            <div className="grid gap-2">
              {repos.map((repo) => (
                <ConnectedRepoRow
                  isDisconnecting={disconnectingRepoId === repo.githubRepoId}
                  key={repo.githubRepoId}
                  onDisconnect={() =>
                    void handleDisconnect(repo.githubRepoId, repo.fullName)
                  }
                  repo={repo}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              No repositories connected yet.
            </p>
          )}
        </div>
      ) : null}

      {notice ? (
        <div
          aria-live="polite"
          className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">GitHub connection needs attention.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {pendingSelection !== null ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-medium text-zinc-900">
            Choose one installed repository
          </p>
          {pendingSelection.repositories.map((repo: RepositoryOption) => (
            <div
              className="flex flex-col gap-3 border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              key={repo.githubRepoId}
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  {repo.fullName}
                </p>
                <a
                  className="mt-1 block break-words text-xs text-zinc-500 underline"
                  href={repo.htmlUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {repo.private ? "Private" : "Public"} repository
                </a>
              </div>
              <button
                className="h-10 w-fit border border-black px-4 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={connectingRepoId !== null || !canConnectMore}
                onClick={() =>
                  void handleConnectInstalledRepository(repo.githubRepoId)
                }
                type="button"
              >
                {connectingRepoId === repo.githubRepoId
                  ? "Connecting..."
                  : "Connect"}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ConnectedRepoRow({
  isDisconnecting,
  onDisconnect,
  repo,
}: {
  isDisconnecting: boolean;
  onDisconnect: () => void;
  repo: ConnectedRepository;
}) {
  return (
    <div className="flex flex-col gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-emerald-800">Connected</p>
        <a
          className="mt-1 block break-words text-emerald-950 underline"
          href={repo.htmlUrl}
          rel="noreferrer"
          target="_blank"
        >
          {repo.fullName}
        </a>
      </div>
      <button
        className="h-10 w-fit border border-black/20 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDisconnecting}
        onClick={onDisconnect}
        type="button"
      >
        {isDisconnecting ? "Disconnecting..." : "Disconnect"}
      </button>
    </div>
  );
}

function clearInstallationQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("installation_id");
  url.searchParams.delete("setup_action");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(timestamp);
}

function errorMessage(
  error: unknown,
  fallback = "GitHub connection failed. Reinstall the GitHub App and try again.",
) {
  return error instanceof Error ? error.message : fallback;
}
