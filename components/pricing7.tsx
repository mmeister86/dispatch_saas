"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingPlan {
  name: string;
  badge?: string;
  description: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

interface Pricing7Props {
  className?: string;
}

const PLANS: PricingPlan[] = [
  {
    name: "Good",
    description: "For solo builders posting a few strong updates each month.",
    price: "€9/mo",
    features: [
      "1 repo",
      "20 published tweets / month",
      "100 drafts generated / month",
    ],
  },
  {
    name: "Better",
    badge: "Best for consistent builders",
    description:
      "For founders who ship often and want every meaningful update covered.",
    price: "€19/mo",
    features: [
      "Up to 5 repos",
      "60 published tweets / month",
      "300 drafts generated / month",
    ],
    highlighted: true,
  },
];

const Pricing7 = ({ className }: Pricing7Props) => {
  return (
    <section id="pricing" className={cn("py-32", className)}>
      <div className="container">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-semibold tracking-tight lg:text-5xl">
            Simple pricing for builders who keep shipping.
          </h2>
          <p className="text-muted-foreground lg:text-lg">
            Built around the way indie builders ship: small updates, steady
            momentum, no content calendar required.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-2 md:grid-rows-[auto_auto_auto_1fr_auto]">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "grid min-w-0 grid-rows-[auto_auto_auto_1fr_auto] rounded-lg bg-card p-6 md:row-span-5 md:grid-rows-subgrid",
                plan.highlighted
                  ? "border-2 border-primary"
                  : "border border-border",
              )}
            >
              <div className="mb-4 flex min-h-6 items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.badge ? (
                  <Badge variant="outline">{plan.badge}</Badge>
                ) : null}
              </div>

              <div className="mb-5 flex min-w-0 flex-wrap items-end gap-x-1">
                <span className="min-w-0 text-4xl font-medium tracking-tight">
                  {plan.price}
                </span>
              </div>

              <p className="text-muted-foreground">{plan.description}</p>

              <ul className="mt-8 flex flex-col gap-3 self-start">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-1 size-4 shrink-0" />
                    <span className="min-w-0 wrap-break-word">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 self-end">
                <SignInButton mode="modal">
                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    className="group w-full gap-2"
                  >
                    <span>Get your first draft</span>
                    <ArrowRight className="size-4 -rotate-45 transition-all ease-out group-hover:translate-x-1 group-hover:rotate-0" />
                  </Button>
                </SignInButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Pricing7 };
