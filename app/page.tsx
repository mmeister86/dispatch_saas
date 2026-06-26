"use client";

import {
  Show,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { LandingPage } from "@/components/landing/landing-page";
import { api } from "@/convex/_generated/api";

export default function Home() {
  return (
    <main>
      <Show when="signed-out">
        <LandingSkeleton />
      </Show>

      <Show when="signed-in">
        <SignedInHome />
      </Show>
    </main>
  );
}

function LandingSkeleton({ dashboardHref }: { dashboardHref?: string }) {
  return <LandingPage dashboardHref={dashboardHref} />;
}

function SignedInHome() {
  const { user } = useUser();
  const access = useQuery(api.billing.currentAccess);

  if (access === undefined) {
    return null;
  }

  if (access.state === "active") {
    return <LandingSkeleton dashboardHref="/dashboard" />;
  }

  return (
    <SignedInPaywallShell>
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
    </SignedInPaywallShell>
  );
}

function SignedInPaywallShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-12 text-black">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Dispatch</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Subscription
            </h1>
          </div>
          <UserButton />
        </div>

        {children}
      </div>
    </section>
  );
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
