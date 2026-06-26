"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { navigationLinks, pricingSignal } from "@/components/landing/landing-data";
import { cn } from "@/lib/utils";

export function LandingNav({ dashboardHref }: { dashboardHref?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="container flex min-h-16 items-center justify-between gap-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid size-8 place-items-center border border-foreground bg-foreground font-heading text-sm font-bold text-background">
            D
          </span>
          <span className="font-heading text-lg font-semibold tracking-normal">
            Dispatch
          </span>
        </Link>

        <nav aria-label="Landing navigation" className="hidden items-center gap-6 xl:flex">
          {navigationLinks.map((link) => (
            <a
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            {pricingSignal.map((price) => (
              <span className="border border-border bg-card px-2.5 py-1" key={price}>
                {price}
              </span>
            ))}
          </div>
          {dashboardHref ? (
            <Button asChild size="sm">
              <a href={dashboardHref}>Dashboard</a>
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button size="sm">
                Get your first draft
                <ArrowRight className="size-4" />
              </Button>
            </SignInButton>
          )}
        </div>

        <button
          aria-controls="landing-mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-11 place-items-center border border-border bg-card xl:hidden"
          onClick={() => setOpen((next) => !next)}
          type="button"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        aria-hidden={!open}
        id="landing-mobile-menu"
        className={cn(
          "grid border-b border-border bg-background transition-[grid-template-rows] duration-300 xl:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        {open ? (
          <div className="overflow-hidden">
            <div className="container grid gap-5 py-5">
              <nav aria-label="Mobile landing navigation" className="grid gap-1">
                {navigationLinks.map((link) => (
                  <a
                    className="flex min-h-11 items-center border border-transparent px-2 text-base font-medium text-muted-foreground hover:border-border hover:text-foreground"
                    href={link.href}
                    key={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              {dashboardHref ? (
                <Button asChild>
                  <a href={dashboardHref}>Dashboard</a>
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button>Get your first draft</Button>
                </SignInButton>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
