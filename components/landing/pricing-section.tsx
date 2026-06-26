"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { plans } from "@/components/landing/landing-data";
import { cn } from "@/lib/utils";

export function PricingSection({ id }: { id: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-(--space-section)" id={id}>
      <div className="container">
        <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <h2 className="max-w-2xl text-4xl font-semibold tracking-normal md:text-5xl">
            Simple pricing for builders who keep shipping.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Built around the way indie builders ship: small updates, steady momentum, no content calendar required.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.article
              className={cn(
                "grid border bg-card p-6",
                index === 1 ? "border-foreground" : "border-border",
              )}
              key={plan.name}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { scale: 0.995 }}
            >
              <div className="flex min-h-8 items-start justify-between gap-4">
                <h3 className="text-2xl font-semibold tracking-normal">
                  {plan.name}
                </h3>
                {"badge" in plan ? (
                  <span className="border border-accent px-2.5 py-1 text-xs font-semibold text-accent">
                    {plan.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-5 font-heading text-5xl font-semibold">
                {plan.price}
              </p>
              <p className="mt-4 text-muted-foreground">{plan.description}</p>
              <ul className="mt-7 grid gap-3">
                {plan.features.map((feature) => (
                  <li className="flex gap-3 text-sm" key={feature}>
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <SignInButton mode="modal">
                <Button className="mt-8 w-full gap-2" variant={index === 1 ? "default" : "outline"}>
                  Get your first draft
                  <ArrowRight className="size-4" />
                </Button>
              </SignInButton>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
