import { ArrowUpRight } from "lucide-react";
import { legalLinks, navigationLinks } from "@/components/landing/landing-data";

const buildLog = {
  label: "Built in public by @matthias_builds",
  href: "https://x.com/matthias_builds",
};

export function LandingFooter() {
  const footerLinks = [...navigationLinks, ...legalLinks];

  return (
    <footer className="border-t border-border py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="font-heading text-5xl font-semibold tracking-normal md:text-7xl">
              Dispatch
            </p>
            <a
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              href={buildLog.href}
            >
              {buildLog.label}
              <ArrowUpRight className="size-4" />
            </a>
          </div>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground md:justify-self-end md:text-right">
            Turn meaningful commits into posts worth sharing.
          </p>
        </div>

        <nav className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-6">
          {footerLinks.map((link) => (
            <a
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
