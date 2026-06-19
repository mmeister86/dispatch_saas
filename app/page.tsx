"use client";

import {
  Show,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
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

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-12 text-black">
      <section className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Dispatch</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Commit-to-post workspace
            </h1>
          </div>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>

        <Show when="signed-out">
          <div className="flex flex-col gap-5">
            <p className="text-lg leading-8 text-zinc-700">
              Sign in with GitHub to subscribe and unlock your Dispatch
              workspace.
            </p>
            <SignInButton mode="modal">
              <button className="h-11 w-fit border border-black bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                Sign in with GitHub
              </button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <GuardedApp />
        </Show>
      </section>
    </main>
  );
}

function GuardedApp() {
  const { user } = useUser();
  const access = useQuery(api.billing.currentAccess);

  if (access === undefined) {
    return (
      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Subscription</p>
        <p className="mt-2 text-lg font-semibold">Checking access...</p>
      </div>
    );
  }

  if (access.state !== "active") {
    return (
      <PaywallView
        email={
          access.state === "needsSubscription"
            ? access.email ??
              user?.primaryEmailAddress?.emailAddress ??
              user?.fullName ??
              "Signed in"
            : "Signed in"
        }
      />
    );
  }

  return <SubscriberApp access={access} />;
}

function PaywallView({ email }: { email: string }) {
  const createCheckout = useAction(api.billing.createCheckout);
  const [checkoutPlan, setCheckoutPlan] = useState<"good" | "better" | null>(
    null,
  );

  async function handleCheckout(plan: "good" | "better") {
    setCheckoutPlan(plan);

    try {
      const checkout = await createCheckout({ plan });
      window.location.assign(checkout.url);
    } finally {
      setCheckoutPlan(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Signed in as</p>
        <p className="mt-2 text-lg font-semibold">{email}</p>
      </div>

      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Subscription needed</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">
          Choose a plan to enter Dispatch.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-700">
          Dispatch is pay-first so the commit-to-post flow can stay fast,
          private, and protected from public abuse.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="h-11 border border-black bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checkoutPlan !== null}
            onClick={() => void handleCheckout("good")}
            type="button"
          >
            {checkoutPlan === "good" ? "Opening..." : "Start with Good"}
          </button>
          <button
            className="h-11 border border-black/20 bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checkoutPlan !== null}
            onClick={() => void handleCheckout("better")}
            type="button"
          >
            {checkoutPlan === "better" ? "Opening..." : "Start with Better"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubscriberApp({
  access,
}: {
  access: {
    email?: string;
    plan: "good" | "better";
    currentPeriodEnd: number;
    postsThisPeriod: number;
  };
}) {
  return (
    <div className="grid gap-5">
      <div className="border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-medium text-emerald-700">
          Connected and paid
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">
          Your Dispatch workspace is unlocked.
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-700">
          Next up: connect the GitHub repo Dispatch should watch for commits.
        </p>
      </div>

      <GitHubRepoPanel />
      <XAccountPanel />

      <dl className="grid gap-3 border border-black/10 p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-medium text-zinc-500">Plan</dt>
          <dd className="mt-1 capitalize">{access.plan}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Posts used</dt>
          <dd className="mt-1">{access.postsThisPeriod}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Renews</dt>
          <dd className="mt-1">
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
            }).format(access.currentPeriodEnd)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function XAccountPanel() {
  const status = useQuery(api.x.connectionStatus);
  const startConnection = useAction(api.x.startConnection);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnectX() {
    setIsConnecting(true);
    setError(null);

    try {
      const connection = await startConnection({});
      window.location.assign(connection.url);
    } catch (err) {
      setError(errorMessage(err, "X connection failed. Try again."));
      setIsConnecting(false);
    }
  }

  return (
    <section className="border border-black/10 p-5">
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
          className="h-10 w-fit border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === undefined || isConnecting}
          onClick={() => void handleConnectX()}
          type="button"
        >
          {isConnecting ? "Connecting..." : "Connect X account"}
        </button>
      </div>

      {status === undefined ? (
        <p className="mt-4 text-sm text-zinc-500">Checking X account...</p>
      ) : status.connected ? (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-800">Connected</p>
          <p className="mt-1 text-emerald-950">
            {status.username ? `@${status.username}` : "Ready to post to X."}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-600">
          No X account connected yet.
        </p>
      )}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
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
  const processedInstallationId = useRef<string | null>(null);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);
  const [isCompletingInstallation, setIsCompletingInstallation] =
    useState(false);
  const [connectingRepoId, setConnectingRepoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");

    if (!installationId || processedInstallationId.current === installationId) {
      return;
    }

    processedInstallationId.current = installationId;
    setIsCompletingInstallation(true);
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
    setError(null);

    try {
      await connectInstalledRepository({
        installationId: pendingSelection.installationId,
        githubRepoId,
      });
      setPendingSelection(null);
      clearInstallationQueryParams();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setConnectingRepoId(null);
    }
  }

  const repoCount = connection?.repoCount ?? 0;
  const repoLimit = connection?.repoLimit ?? 0;
  const canConnectMore = connection?.canConnectMore ?? false;
  const installUrl = connection?.installUrl ?? "";
  const repos = connection?.repos ?? [];
  const canOpenInstallUrl =
    connection !== undefined &&
    connection !== null &&
    canConnectMore &&
    !isCompletingInstallation &&
    installUrl.length > 0;

  return (
    <section className="border border-black/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">GitHub repo</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            Connect GitHub repos
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Dispatch watches selected repositories through the GitHub App push
            webhook.
          </p>
        </div>
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
            {isCompletingInstallation ? "Connecting..." : "Install GitHub App"}
          </button>
        )}
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
          </div>

          {repos.length > 0 ? (
            <div className="grid gap-2">
              {repos.map((repo) => (
                <ConnectedRepoRow key={repo.githubRepoId} repo={repo} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              No repositories connected yet.
            </p>
          )}
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

function ConnectedRepoRow({ repo }: { repo: ConnectedRepository }) {
  return (
    <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm">
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
  );
}

function clearInstallationQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("installation_id");
  url.searchParams.delete("setup_action");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function errorMessage(
  error: unknown,
  fallback = "GitHub connection failed. Reinstall the GitHub App and try again.",
) {
  return error instanceof Error
    ? error.message
    : fallback;
}
