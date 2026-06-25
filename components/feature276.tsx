"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Blocks,
  BrushCleaning,
  ChartLine,
  Clock,
  CodeXml,
  Globe,
  Layers,
  Lock,
  Palette,
  Plug2,
  Rocket,
  Settings,
  Shield,
  Snowflake,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

interface FeatureIconListItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
  href?: string;
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
  heading: "Build faster with production ready features",
  description:
    "Every component is built with React, Tailwind CSS, and shadcn/ui. Copy, paste, and customize to match your brand in minutes.",
  label: "Features",
  features: [
    {
      icon: <Zap className="size-5" />,
      title: "Full Source Code",
      description:
        "Every block ships as plain React you own. No runtime dependency, no SDK lock-in, just copy and customize.",
    },
    {
      icon: <Palette className="size-5" />,
      title: "Responsive Design",
      description:
        "Every block adapts seamlessly from mobile to desktop with Tailwind's mobile-first utility classes.",
    },
    {
      icon: <Shield className="size-5" />,
      title: "Accessibility & Usability",
      description:
        "Built on Radix UI primitives with proper ARIA attributes, keyboard navigation, and focus management.",
    },
    {
      icon: <Settings className="size-5" />,
      title: "TypeScript Native",
      description:
        "Fully typed props and interfaces so your editor catches issues before they reach production.",
    },
    {
      icon: <Layers className="size-5" />,
      title: "Customizable",
      description:
        "Override any prop, swap icons, adjust spacing — every block is designed to be extended, not locked down.",
    },
    {
      icon: <Rocket className="size-5" />,
      title: "Production Ready",
      description:
        "Battle-tested in real projects. No placeholder hacks, no lorem ipsum — clean code you can ship today.",
    },
    {
      icon: <Blocks className="size-5" />,
      title: "Registry Compatible",
      description:
        "Install blocks directly with the shadcn CLI. Dependencies and registry items are listed in every block's MDX.",
    },
    {
      icon: <Globe className="size-5" />,
      title: "Framework Agnostic",
      description:
        "Plain ESM + React that works with Next.js, Vite, Remix, and Astro without any Shadcnblocks SDK.",
    },
    {
      icon: <ChartLine className="size-5" />,
      title: "Consistent Spacing",
      description:
        "Shared section padding, container widths, and gap scales so blocks stack into cohesive pages.",
    },
    {
      icon: <Sparkles className="size-5" />,
      title: "Theme Tokens",
      description:
        "All colors come from your shadcn/ui theme — foreground, muted, primary, card — no hardcoded values.",
    },
    {
      icon: <Workflow className="size-5" />,
      title: "Copy Paste Workflow",
      description:
        "Browse the explorer, preview with your theme, then copy the code directly into your project.",
    },
    {
      icon: <Lock className="size-5" />,
      title: "Open Source",
      description:
        "MIT-licensed source code you own completely. Fork it, modify it, sell products built with it.",
    },
  ],
};

const MAX_FEATURES = 6;
const ICONS: React.ComponentType<{ className?: string }>[] = [
  Plug2,
  CodeXml,
  Snowflake,
  Clock,
  BrushCleaning,
  Zap,
];

const Feature276 = (props: Props) => {
  const { heading, description, label, features, className } = {
    ...defaultProps,
    ...props,
  };
  const items = (features ?? []).slice(0, MAX_FEATURES);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className={cn("overflow-hidden py-32", className)}>
      <div className="container">
        <div className="flex flex-col items-center justify-center">
          <p className="rounded-full bg-muted px-4 py-1 text-xs uppercase">
            {label}
          </p>
          <h2 className="relative z-20 mx-auto max-w-3xl py-2 text-center text-5xl font-semibold tracking-tight md:py-7 lg:text-6xl">
            {heading}
          </h2>
          <p className="mx-auto max-w-xl text-center text-muted-foreground lg:text-lg">
            {description}
          </p>

          <div className="relative mt-10 grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                        className="absolute inset-0 block h-full w-full rounded-2xl bg-muted-foreground/20"
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
                      "relative z-20 flex h-full flex-col items-center justify-center gap-4 rounded-2xl bg-muted p-5 text-center",
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
