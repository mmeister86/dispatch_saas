"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, Check, GitCommitHorizontal, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

const draftVariants = [
  {
    label: "What shipped",
    text: "I tightened the onboarding flow today. Tiny change, but it removes the moment where new users used to pause and wonder what to do next.",
  },
  {
    label: "What I learned",
    text: "The best onboarding fix was not another screen. It was deleting one decision and making the next action feel obvious.",
  },
  {
    label: "Behind the scenes",
    text: "Spent the morning turning a messy first-run path into one clean handoff. Less UI, more momentum.",
  },
];

export function CommitWorkbenchHero({ id }: { id: string }) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 18 };
  const animate = { opacity: 1, y: 0 };

  return (
    <section className="overflow-hidden pt-28 md:pt-32" id={id}>
      <div className="container grid min-h-[calc(100svh-5rem)] items-center gap-12 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <motion.div
          animate={animate}
          className="max-w-2xl"
          initial={initial}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted-foreground">
            <span className="size-2 bg-accent" />
            Built for indie builders shipping in public
          </p>
          <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-normal text-foreground sm:text-6xl xl:text-7xl">
            Turn commits into tweets you&apos;d actually post.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Dispatch reads your latest GitHub commit, finds the build-in-public angle, and gives you 2-3 post-ready drafts in seconds.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SignInButton mode="modal">
              <Button className="group h-12 w-full gap-2 px-5 text-base sm:w-auto">
                Get your first draft
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </SignInButton>
            <p className="text-sm font-medium text-muted-foreground">
              Pay first. Connect once. Post in about 20 seconds.
            </p>
          </div>
        </motion.div>

        <motion.div
          animate={animate}
          className="relative"
          initial={initial}
          transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="border border-foreground bg-card shadow-[10px_10px_0_oklch(0.17_0.012_135)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Commit Workbench
                </p>
                <p className="mt-1 font-heading text-lg font-semibold">
                  feat: tighten onboarding flow
                </p>
              </div>
              <GitCommitHorizontal className="size-5 text-accent" />
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border-b border-border p-5 lg:border-r lg:border-b-0">
                <p className="text-sm font-semibold text-muted-foreground">
                  Commit context
                </p>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="border border-border bg-background p-3">
                    Replaced the empty first-run screen with a repo checklist.
                  </div>
                  <div className="border border-border bg-background p-3">
                    Added clearer copy for X connection recovery.
                  </div>
                  <div className="border border-border bg-background p-3">
                    Removed a redundant confirmation step before posting.
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Sparkles className="size-4 text-accent" />
                  2-3 post-ready drafts
                </div>
                <div className="mt-4 grid gap-3">
                  {draftVariants.map((draft, index) => (
                    <motion.article
                      animate={animate}
                      className="border border-border bg-background p-4"
                      initial={initial}
                      key={draft.label}
                      transition={{
                        duration: 0.45,
                        delay: reduceMotion ? 0 : 0.18 + index * 0.09,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={reduceMotion ? undefined : { y: -2 }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {draft.label}
                        </p>
                        {index === 0 ? <Check className="size-4 text-accent" /> : null}
                      </div>
                      <p className="text-sm leading-6">{draft.text}</p>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
