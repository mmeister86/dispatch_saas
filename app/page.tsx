"use client";

import {
  Show,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

type ActiveAccess = {
  email?: string;
  plan: "good" | "better";
  currentPeriodEnd: number;
  postsThisPeriod: number;
  postLimit: number;
  postsRemaining: number;
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
  access: ActiveAccess;
}) {
  const renewalDate = formatDate(access.currentPeriodEnd);

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
          Open drafts to review generated posts, or settings to manage repos
          and billing.
        </p>
      </div>

      <SettingsWorkspaceCta />
      <DraftsWorkspaceCta />
      <XAccountPanel />

      <dl className="grid gap-3 border border-black/10 p-5 text-sm sm:grid-cols-4">
        <div>
          <dt className="font-medium text-zinc-500">Plan</dt>
          <dd className="mt-1 capitalize">{access.plan}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Posts used</dt>
          <dd className="mt-1">
            {access.postsThisPeriod}/{access.postLimit}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Remaining</dt>
          <dd className="mt-1">{access.postsRemaining}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Renews</dt>
          <dd className="mt-1">{renewalDate}</dd>
        </div>
      </dl>
    </div>
  );
}

function SettingsWorkspaceCta() {
  return (
    <section className="border border-black/10 p-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Settings</p>
        <h2 className="mt-2 text-xl font-semibold tracking-normal">
          Manage repos and billing in one place.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
          Connect or disconnect GitHub repos and open your Lemon Squeezy
          billing portal from the dedicated settings screen.
        </p>
        <Link
          className="mt-4 inline-flex h-10 w-fit items-center border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          href="/settings"
        >
          Manage settings
        </Link>
      </div>
    </section>
  );
}

function DraftsWorkspaceCta() {
  return (
    <section className="border border-black/10 p-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Drafts workspace</p>
        <h2 className="mt-2 text-xl font-semibold tracking-normal">
          Review commits on the dedicated canvas.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
          Open the routed workspace to browse repositories, choose a commit
          draft, edit variants, attach an image, and post to X.
        </p>
        <Link
          className="mt-4 inline-flex h-10 w-fit items-center border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          href="/drafts"
        >
          Open drafts workspace
        </Link>
      </div>
    </section>
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

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(timestamp);
}

function errorMessage(
  error: unknown,
  fallback = "GitHub connection failed. Reinstall the GitHub App and try again.",
) {
  return error instanceof Error
    ? error.message
    : fallback;
}
