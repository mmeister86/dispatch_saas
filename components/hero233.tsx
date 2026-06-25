"use client";

import { SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Hero233Props {
  className?: string;
}

const Hero233 = ({ className }: Hero233Props) => {
  const isMobile = useIsMobile();

  return (
    <section
      id="home"
      className={cn(
        "relative h-svh max-h-[1200px] min-h-[600px] overflow-hidden bg-background py-32",
        className,
      )}
    >
      <div className="relative z-20 container flex flex-col items-center justify-center gap-4 py-10 text-center md:mt-22">
        <div className="absolute -z-1 size-full max-w-3xl bg-background blur-xl" />
        <Button
          variant="secondary"
          className="text-md group my-16 flex w-fit items-center justify-center gap-3 rounded-full bg-muted/60 px-5 py-1 tracking-tight md:my-5"
        >
          <span className="size-2 rounded-full bg-foreground" />
          <span>Built for indie builders shipping in public</span>
        </Button>
        <div className="relative flex max-w-4xl items-center justify-center text-center text-5xl font-medium tracking-tight md:text-7xl">
          <h1 className="relative z-10">
            {"Turn commits into tweets you'd actually post."}
          </h1>
        </div>

        <p className="mt-5 max-w-xl bg-background text-muted-foreground/80">
          Dispatch reads your latest GitHub commit, finds the build-in-public angle, and gives you 2-3 post-ready drafts in seconds.
        </p>
        <div className="my-5">
          <SignInButton mode="modal">
            <Button
              variant="default"
              className="text-md group flex w-fit items-center justify-center gap-2 rounded-full px-4 py-1 tracking-tight"
            >
              <span>Get your first draft</span>
              <ArrowRight className="size-4 -rotate-45 transition-all ease-out group-hover:ml-3 group-hover:rotate-0" />
            </Button>
          </SignInButton>
        </div>
      </div>

      <div className="absolute top-0 flex size-full justify-center">
        {Array.from({ length: isMobile ? 7 : 18 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100%" }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
              ease: "easeOut",
            }}
            className="w-24 border-l bg-gradient-to-b to-transparent transition-all ease-in-out hover:scale-110 hover:from-black/2"
          />
        ))}
      </div>
    </section>
  );
};

export { Hero233 };
