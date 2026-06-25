"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
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

export function SettingsWorkspace({ embedded = false }: { embedded?: boolean } = {}) {
  const { user } = useUser();
  const access = useQuery(api.billing.currentAccess);
  const Root = embedded ? "div" : "main";

  if (access === undefined) {
    return (
      <Root
        className={`flex items-center justify-center px-6 text-zinc-950 ${
          embedded ? "min-h-[420px]" : "min-h-screen bg-zinc-50"
        }`}
      >
        <p className="text-sm font-medium text-zinc-500">
          Loading settings...
        </p>
      </Root>
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

    return (
      <SettingsGate
        email={email}
        embedded={embedded}
        isSignedOut={access.state === "signedOut"}
      />
    );
  }

  return <ActiveSettingsWorkspace access={access} embedded={embedded} />;
}

function SettingsGate({
  email,
  embedded,
  isSignedOut,
}: {
  email: string;
  embedded: boolean;
  isSignedOut: boolean;
}) {
  const Root = embedded ? "div" : "main";

  return (
    <Root
      className={`flex flex-1 items-center justify-center px-6 py-12 text-zinc-950 ${
        embedded ? "min-h-[420px]" : "min-h-screen bg-zinc-50"
      }`}
    >
      <section className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-sm font-semibold text-emerald-700">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Subscribe before managing Dispatch.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {isSignedOut
            ? "Sign in with GitHub, choose a plan, then return here to manage repos and billing."
            : `${email} still needs an active plan before settings are available.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {isSignedOut ? (
            <SignInButton mode="modal">
              <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
                Sign in with GitHub
              </button>
            </SignInButton>
          ) : null}
          <Link
            className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold transition-colors hover:bg-zinc-50"
            href="/"
          >
            Back to workspace
          </Link>
        </div>
      </section>
    </Root>
  );
}

function ActiveSettingsWorkspace({
  access,
  embedded,
}: {
  access: ActiveAccess;
  embedded: boolean;
}) {
  const Root = embedded ? "div" : "main";

  return (
    <Root
      className={`text-zinc-950 ${
        embedded ? "grid gap-6" : "min-h-screen bg-zinc-50 p-4 sm:p-6 lg:p-8"
      }`}
    >
      <section className="grid gap-6">
        <header className="border-b border-zinc-200 pb-5">
          <p className="text-sm font-semibold text-emerald-700">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">
            Workspace settings.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Manage repositories, X account access, and workspace connections.
          </p>
        </header>

        <XAccountPanel />
        <GitHubRepoPanel />
        <BillingPortalPanel access={access} />
      </section>
    </Root>
  );
}

export function BillingWorkspace() {
  const access = useQuery(api.billing.currentAccess);

  if (access === undefined) {
    return (
      <main className="flex min-h-[420px] items-center justify-center bg-zinc-50 px-6 text-zinc-950">
        <p className="text-sm font-medium text-zinc-500">Loading billing...</p>
      </main>
    );
  }

  if (access.state !== "active") {
    return (
      <main className="flex min-h-[420px] items-center justify-center bg-zinc-50 px-6 text-zinc-950">
        <section className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm font-semibold text-emerald-700">Billing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Subscribe before managing billing.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Return to the dashboard entry point to choose a plan.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            href="/"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="border-b border-zinc-200 pb-5">
        <p className="text-sm font-semibold text-emerald-700">Billing</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">
          Plan and usage
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Open the Lemon Squeezy portal, check renewal timing, and keep an eye
          on the monthly post cap.
        </p>
      </header>
      <BillingPortalPanel access={access} />
    </div>
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
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Subscription</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            Manage billing
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            Open Lemon Squeezy to update payment details, invoices, and your
            subscription.
          </p>
        </div>
        <button
          className="h-10 w-fit rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isOpeningPortal}
          onClick={() => void handleOpenPortal()}
          type="button"
        >
          {isOpeningPortal ? "Opening..." : "Open billing portal"}
        </button>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="font-medium text-zinc-500">Plan</dt>
          <dd className="mt-1 capitalize">{access.plan}</dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="font-medium text-zinc-500">Posts used</dt>
          <dd className="mt-1">
            {access.postsThisPeriod}/{access.postLimit}
          </dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="font-medium text-zinc-500">Remaining</dt>
          <dd className="mt-1">{access.postsRemaining}</dd>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <dt className="font-medium text-zinc-500">Renews</dt>
          <dd className="mt-1">{formatDate(access.currentPeriodEnd)}</dd>
        </div>
      </dl>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">Billing needs attention.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}
    </section>
  );
}

export function XAccountPanel() {
  const status = useQuery(api.x.connectionStatus);
  const startConnection = useAction(api.x.startConnection);
  const disconnectX = useMutation(api.x.disconnectX);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleConnectX() {
    setIsConnecting(true);
    setError(null);
    setNotice(null);

    try {
      const connection = await startConnection({});
      window.location.assign(connection.url);
    } catch (err) {
      setError(errorMessage(err, "X connection failed. Try again."));
      setIsConnecting(false);
    }
  }

  async function handleDisconnectX() {
    setIsDisconnecting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await disconnectX({});

      if (!result.disconnected) {
        throw new Error("X is no longer connected.");
      }

      setNotice("X account disconnected. Reconnect any time to post again.");
    } catch (err) {
      setError(errorMessage(err, "Disconnect failed. Try again."));
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">X account</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            Connect X account
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Dispatch posts approved drafts through your connected X account.
          </p>
        </div>
        <button
          className="h-10 w-fit rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === undefined || isConnecting || isDisconnecting}
          onClick={() => void handleConnectX()}
          type="button"
        >
          {isConnecting
            ? "Connecting..."
            : status?.connected
              ? "Reconnect X account"
              : "Connect X account"}
        </button>
      </div>

      {status === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">Checking X account...</p>
      ) : status.connected ? (
        <div className="mt-4 flex flex-col gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium text-emerald-800">Connected</p>
            <p className="mt-1 text-emerald-950">
              {status.username ? `@${status.username}` : "Ready to post to X."}
            </p>
          </div>
          <button
            className="h-10 w-fit rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisconnecting || isConnecting}
            onClick={() => void handleDisconnectX()}
            type="button"
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-600">
          No X account connected yet.
        </p>
      )}

      {notice ? (
        <div
          aria-live="polite"
          className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">X connection needs attention.</p>
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
  const [canUseLocalInstallationRecovery, setCanUseLocalInstallationRecovery] =
    useState(false);
  const [installationUrlInput, setInstallationUrlInput] = useState("");
  const [isLoadingExistingInstallation, setIsLoadingExistingInstallation] =
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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCanUseLocalInstallationRecovery(
        window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1",
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

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

  async function handleLoadExistingInstallation() {
    const installationId = extractGitHubInstallationUrlId(installationUrlInput);

    if (installationId === null) {
      setError("Enter the GitHub installation URL.");
      return;
    }

    processedInstallationId.current = installationId;
    setIsLoadingExistingInstallation(true);
    setNotice(null);
    setError(null);

    try {
      const result = await completeInstallation({ installationId });

      if (result.kind === "selectionRequired") {
        setPendingSelection({
          installationId,
          repositories: result.repositories,
        });
        setInstallationUrlInput("");
        return;
      }

      setPendingSelection(null);
      setInstallationUrlInput("");
      setNotice(`${result.repo.fullName} is connected.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoadingExistingInstallation(false);
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
  const connectedRepoIds = new Set(repos.map((repo) => repo.githubRepoId));
  const isOverRepoLimit = repoCount > repoLimit;
  const canOpenInstallUrl =
    connection !== undefined &&
    connection !== null &&
    !connection.hasGitHubInstallation &&
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
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
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
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Use GitHub to grant app access, then load the repositories here to
            choose which ones Dispatch should watch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canChooseInstalledRepo ? (
            <button
              className="h-10 w-fit rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChoosingInstalledRepos}
              onClick={() => void handleChooseInstalledRepo()}
              type="button"
            >
              {isChoosingInstalledRepos
                ? "Loading..."
                : "Load GitHub repositories"}
            </button>
          ) : null}
          {canOpenInstallUrl ? (
            <a
              className="flex h-10 w-fit items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              href={installUrl}
            >
              Install GitHub App
            </a>
          ) : (
            <button
              className="h-10 w-fit rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white opacity-60 disabled:cursor-not-allowed"
              disabled
              type="button"
            >
              {isCompletingInstallation
                ? "Connecting..."
                : "Install GitHub App"}
            </button>
          )}
          {connection !== undefined &&
          connection !== null &&
          connection.hasGitHubInstallation &&
          installUrl.length > 0 ? (
            <a
              className="flex h-10 w-fit items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-50"
              href={installUrl}
            >
              Manage GitHub App access
            </a>
          ) : null}
        </div>
      </div>

      {connection === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">
          Checking connected repos...
        </p>
      ) : connection ? (
        <div className="mt-4 grid gap-3">
          {!connection.hasGitHubInstallation &&
          canUseLocalInstallationRecovery ? (
            <form
              className="grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void handleLoadExistingInstallation();
              }}
            >
              <label
                className="font-medium text-zinc-900"
                htmlFor="github-installation-url"
              >
                GitHub installation URL
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition-colors focus:border-zinc-950"
                  id="github-installation-url"
                  onChange={(event) =>
                    setInstallationUrlInput(event.target.value)
                  }
                  placeholder="https://github.com/settings/installations/141137818"
                  type="url"
                  value={installationUrlInput}
                />
                <button
                  className="h-10 w-fit rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoadingExistingInstallation}
                  type="submit"
                >
                  {isLoadingExistingInstallation
                    ? "Loading..."
                    : "Load installed app"}
                </button>
              </div>
              <p className="text-xs leading-5 text-zinc-500">
                Local development only. Use this when GitHub opens the installed
                app page instead of redirecting back to localhost.
              </p>
            </form>
          ) : null}

          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
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
              No repositories connected yet. Install the GitHub App, then load
              the repositories GitHub allowed for Dispatch.
            </p>
          )}
        </div>
      ) : null}

      {notice ? (
        <div
          aria-live="polite"
          className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-medium">GitHub connection needs attention.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {pendingSelection !== null ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-medium text-zinc-900">
            Available GitHub repositories
          </p>
          {pendingSelection.repositories.map((repo: RepositoryOption) => (
            <RepositoryOptionRow
              isConnected={connectedRepoIds.has(repo.githubRepoId)}
              isConnecting={connectingRepoId === repo.githubRepoId}
              isDisabled={connectingRepoId !== null || !canConnectMore}
              key={repo.githubRepoId}
              onConnect={() =>
                void handleConnectInstalledRepository(repo.githubRepoId)
              }
              repo={repo}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RepositoryOptionRow({
  isConnected,
  isConnecting,
  isDisabled,
  onConnect,
  repo,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  isDisabled: boolean;
  onConnect: () => void;
  repo: RepositoryOption;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium">{repo.fullName}</p>
        <a
          className="mt-1 block break-words text-xs text-zinc-500 underline"
          href={repo.htmlUrl}
          rel="noreferrer"
          target="_blank"
        >
          {repo.private ? "Private" : "Public"} repository
        </a>
      </div>
      {isConnected ? (
        <p className="h-10 w-fit rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
          Connected
        </p>
      ) : (
        <button
          className="h-10 w-fit rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDisabled}
          onClick={onConnect}
          type="button"
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
      )}
      {isConnected ? (
        <p className="text-xs text-zinc-500">Already connected to Dispatch.</p>
      ) : null}
    </div>
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
    <div className="flex flex-col gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
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
        className="h-10 w-fit rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
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

function extractGitHubInstallationUrlId(value: string) {
  try {
    const url = new URL(value.trim());

    if (url.hostname !== "github.com") {
      return null;
    }

    const match = url.pathname.match(/^\/settings\/installations\/(\d+)$/);

    return match?.[1] ?? null;
  } catch {
    return null;
  }
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
