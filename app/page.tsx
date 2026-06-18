"use client";

import {
  Show,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-16 text-black">
      <section className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Dispatch</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Clerk GitHub sign-in
            </h1>
          </div>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>

        <Show when="signed-out">
          <div className="flex flex-col gap-5">
            <p className="text-lg leading-8 text-zinc-700">
              Sign in with GitHub through Clerk to verify the authenticated
              Convex session.
            </p>
            <SignInButton mode="modal">
              <button className="h-11 w-fit border border-black bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                Sign in with GitHub
              </button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <ViewerStatus />
        </Show>
      </section>
    </main>
  );
}

function ViewerStatus() {
  const { user } = useUser();
  const viewer = useQuery(api.viewer.current);
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
        <p className="text-sm font-medium text-zinc-500">Clerk session</p>
        <p className="mt-2 text-lg font-semibold">
          {user?.primaryEmailAddress?.emailAddress ??
            user?.fullName ??
            "Signed in"}
        </p>
      </div>

      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Convex identity</p>
        {viewer === undefined ? (
          <p className="mt-2 text-lg font-semibold">Checking...</p>
        ) : viewer === null ? (
          <p className="mt-2 text-lg font-semibold text-red-700">
            Not authenticated in Convex
          </p>
        ) : (
          <div className="mt-3 grid gap-2 text-sm text-zinc-700">
            <p>
              <span className="font-medium text-black">Email:</span>{" "}
              {viewer.email ?? "No email on token"}
            </p>
            <p>
              <span className="font-medium text-black">Name:</span>{" "}
              {viewer.name ?? "No name on token"}
            </p>
            <p className="break-all">
              <span className="font-medium text-black">Token:</span>{" "}
              {viewer.tokenIdentifier}
            </p>
          </div>
        )}
      </div>

      <div className="border border-black/10 p-5">
        <p className="text-sm font-medium text-zinc-500">Subscription</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="h-11 border border-black bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checkoutPlan !== null}
            onClick={() => void handleCheckout("good")}
            type="button"
          >
            {checkoutPlan === "good" ? "Opening..." : "Good - EUR 9/mo"}
          </button>
          <button
            className="h-11 border border-black/20 bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checkoutPlan !== null}
            onClick={() => void handleCheckout("better")}
            type="button"
          >
            {checkoutPlan === "better" ? "Opening..." : "Better - EUR 19/mo"}
          </button>
        </div>
      </div>
    </div>
  );
}
