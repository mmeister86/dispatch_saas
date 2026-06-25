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
import { Compare3 } from "@/components/compare3";
import { Faq15 } from "@/components/faq15";
import { Feature276 } from "@/components/feature276";
import { Footer24 } from "@/components/footer24";
import { Hero233 } from "@/components/hero233";
import { Navbar11 } from "@/components/navbar11";
import { Pricing7 } from "@/components/pricing7";
import { Testimonial17 } from "@/components/testimonial17";
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
    <main>
      <Show when="signed-out">
        <LandingSkeleton />
      </Show>

      <Show when="signed-in">
        <section className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-12 text-black">
          <div className="flex w-full max-w-2xl flex-col gap-8">
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  Dispatch
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                  Commit-to-post workspace
                </h1>
              </div>
              <UserButton />
            </div>

            <GuardedApp />
          </div>
        </section>
      </Show>
    </main>
  );
}

function LandingSkeleton() {
  return (
    <div className="landing-skeleton-light bg-background text-foreground">
      <Navbar11 />
      <Hero233 />
      <Feature276 />
      <Pricing7 />
      <Compare3 />
      <Testimonial17 />
      <Faq15 />
      <Footer24 />
      <div className="sr-only">
        <SignInButton mode="modal">
          <button type="button">Sign in with GitHub</button>
        </SignInButton>
      </div>
    </div>
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

      <DashboardWorkspaceCta />

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

function DashboardWorkspaceCta() {
  return (
    <section className="border border-black/10 p-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Dashboard</p>
        <h2 className="mt-2 text-xl font-semibold tracking-normal">
          Your central Dispatch workspace is ready.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
          Open the dashboard to review drafts, check recent posts, manage
          settings, and open billing.
        </p>
        <Link
          className="mt-4 inline-flex h-10 w-fit items-center border border-black bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          href="/dashboard"
        >
          Open dashboard
        </Link>
      </div>
    </section>
  );
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(timestamp);
}
