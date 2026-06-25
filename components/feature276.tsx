"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CodeXml,
  Plug2,
  Rocket,
} from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

interface FeatureIconListItem {
  title: string;
  description: string;
}

interface FeatureIconListProps {
  heading: string;
  description?: string;
  label?: string;
  features?: FeatureIconListItem[];
  className?: string;
}

type Feature276Props = FeatureIconListProps;
type Props = Partial<Feature276Props>;

const defaultProps: Feature276Props = {
  heading: "You keep shipping, but your audience never sees the progress.",
  description:
    "Every meaningful commit can build trust. Most of them stay buried in GitHub.",
  label: "Problem",
  features: [
    {
      title: "Connect GitHub",
      description:
        "Authorize the repo you want Dispatch to watch for meaningful product progress.",
    },
    {
      title: "Push a commit",
      description:
        "Ship normally. Dispatch turns the update into post-ready build-in-public angles.",
    },
    {
      title: "Pick the draft worth posting",
      description:
        "Review the strongest version, make it yours if needed, and keep the build log alive.",
    },
  ],
};

const MAX_FEATURES = 3;
const ICONS: React.ComponentType<{ className?: string }>[] = [
  Plug2,
  CodeXml,
  Rocket,
];

const Feature276 = (props: Props) => {
  const { heading, description, label, features, className } = {
    ...defaultProps,
    ...props,
  };
  const items = (features ?? []).slice(0, MAX_FEATURES);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      id="problem"
      className={cn("overflow-hidden py-28 md:py-32", className)}
    >
      <div className="container">
        <div className="flex flex-col items-center justify-center">
          <p className="rounded-full bg-muted px-4 py-1 text-xs uppercase">
            {label}
          </p>
          <h2 className="relative z-20 mx-auto max-w-3xl py-3 text-center text-4xl font-semibold tracking-normal md:py-7 lg:text-6xl">
            {heading}
          </h2>
          <p className="mx-auto max-w-xl text-center text-muted-foreground lg:text-lg">
            {description}
          </p>

          <h3
            id="how-it-works"
            className="mt-16 text-center text-3xl font-semibold tracking-normal"
          >
            How it works
          </h3>

          <div className="relative mt-8 grid w-full grid-cols-1 md:grid-cols-3">
            {items.map((item, idx) => {
              const Icon = ICONS[idx % ICONS.length];
              return (
                <div
                  key={idx}
                  className="group relative block h-full w-full p-2"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {hoveredIndex === idx && (
                      <motion.span
                        className="absolute inset-0 block h-full w-full rounded-lg bg-muted-foreground/20"
                        layoutId="hoverBackground"
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </AnimatePresence>

                  <div
                    className={cn(
                      "relative z-20 flex h-full min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-muted p-6 text-center",
                    )}
                  >
                    <Icon className="mt-3 size-8 stroke-1 text-muted-foreground" />
                    <h3 className="text-2xl font-medium tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Feature276 };
