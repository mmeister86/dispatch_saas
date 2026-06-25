"use client";

import { SignInButton } from "@clerk/nextjs";
import { MenuIcon, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAVIGATION = [
  { label: "Home", href: "/" },
  { label: "Problem", href: "#problem" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Comparison", href: "#comparison" },
  { label: "Proof", href: "#proof" },
  { label: "FAQ", href: "#faq" },
];

const PRICING_SIGNAL = ["Good €9/mo", "Better €19/mo"];
const MOBILE_BREAKPOINT = 1024;

interface Navbar11Props {
  className?: string;
  dashboardHref?: string;
}

const Navbar11 = ({ className, dashboardHref }: Navbar11Props) => {
  const [open, setOpen] = useState(false);
  const dashboardButton = dashboardHref
    ? {
        label: "Dashboard",
        url: dashboardHref,
      }
    : null;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <Fragment>
      <section
        className={cn(
          "pointer-events-auto fixed top-0 z-999 flex min-h-16 w-full items-center justify-center border-b border-border/70 bg-background/95 backdrop-blur",
          className,
        )}
      >
        <div className="container">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <a
              href="#"
              className="flex min-w-0 items-center gap-2 text-lg font-semibold tracking-normal"
            >
              <span className="flex size-7 items-center justify-center rounded-sm bg-foreground text-sm font-semibold text-background">
                D
              </span>
              <span>Dispatch</span>
            </a>

            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-6 xl:flex"
            >
              {NAVIGATION.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-4 xl:flex">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {PRICING_SIGNAL.map((price) => (
                  <span
                    key={price}
                    className="rounded-sm border border-border px-2.5 py-1 text-foreground"
                  >
                    {price}
                  </span>
                ))}
              </div>

              {dashboardButton ? (
                <Button size="sm" asChild>
                  <a href={dashboardButton.url}>{dashboardButton.label}</a>
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button size="sm">Get your first draft</Button>
                </SignInButton>
              )}
            </div>

            <div className="xl:hidden">
              <Button
                aria-label={open ? "Close menu" : "Open menu"}
                className="size-11"
                variant="ghost"
                onClick={() => setOpen((nextOpen) => !nextOpen)}
              >
                {open ? <X className="size-5.5" /> : <MenuIcon className="size-5.5" />}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <MobileNavigationMenu
        dashboardButton={dashboardButton}
        open={open}
        onOpenChange={setOpen}
      />
    </Fragment>
  );
};

interface MobileNavigationMenuProps {
  dashboardButton: { label: string; url: string } | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const MobileNavigationMenu = ({
  dashboardButton,
  onOpenChange,
  open,
}: MobileNavigationMenuProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby={undefined}
        side="top"
        className="dark inset-0 z-998 h-dvh w-full bg-background pt-[3.9375rem] [&>button]:hidden"
      >
        <div className="h-full overflow-y-auto pt-10 pb-20">
          <div className="container">
            <div className="absolute -m-px h-px w-px overflow-hidden border-0 mask-clip-border p-0 text-nowrap whitespace-nowrap">
              <SheetTitle className="text-primary">
                Mobile Navigation
              </SheetTitle>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap gap-2 text-sm font-medium">
                {PRICING_SIGNAL.map((price) => (
                  <span
                    key={price}
                    className="rounded-sm border border-border px-2.5 py-1 text-foreground"
                  >
                    {price}
                  </span>
                ))}
              </div>

              <nav aria-label="Mobile navigation" className="grid gap-1">
                {NAVIGATION.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex h-[3.75rem] items-center rounded-md px-4 text-base font-normal text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => onOpenChange(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {dashboardButton ? (
                <Button asChild>
                  <a href={dashboardButton.url}>{dashboardButton.label}</a>
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button>Get your first draft</Button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { Navbar11 };
