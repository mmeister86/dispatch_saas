import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

const footerData = {
  heading: "Dispatch",
  headingClassName: "text-left",
  buildLog: {
    label: "Built in public by @matthias_builds",
    href: "https://x.com/matthias_builds",
  },
  socialLinks: [
    { label: "Build log", href: "https://x.com/matthias_builds" },
  ],
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Problem", href: "#problem" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Comparison", href: "#comparison" },
    { label: "Proof", href: "#proof" },
    { label: "FAQ", href: "#faq" },
    { label: "Legal notice", href: "/impressum" },
    { label: "Privacy policy", href: "/datenschutz" },
  ],
};

interface Footer24Props {
  className?: string;
}

const Footer24 = ({ className }: Footer24Props) => {
  return (
    <section className={cn("py-16 md:py-32", className)}>
      <div className="container px-4 md:px-6">
        <div className="rounded-lg bg-muted p-8 md:p-16">
          <div className="mb-6 border-b border-border pb-6 text-left md:mb-8 md:pb-8">
            <h1
              className={cn(
                "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl",
                footerData.headingClassName,
              )}
            >
              {footerData.heading}
            </h1>
          </div>

          <div className="mb-12 flex flex-col gap-8 md:mb-16 lg:flex-row lg:justify-between lg:gap-4 xl:gap-8">
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-sm font-medium tracking-wide text-primary uppercase">
                Build log
              </h3>
              <a
                href={footerData.buildLog.href}
                className="flex items-center gap-2 text-base text-muted-foreground transition-colors hover:text-primary md:text-lg"
              >
                {footerData.buildLog.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-col items-start gap-4">
              <h3 className="text-sm font-medium tracking-wide text-primary uppercase">
                Follow along
              </h3>
              <div className="grid gap-4">
                {footerData.socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-base text-muted-foreground transition-colors hover:text-primary md:text-lg"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 py-6 md:flex-row md:items-center md:justify-between md:py-4">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {footerData.navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="text-sm text-muted-foreground md:text-right md:text-xs">
            Turn meaningful commits into posts worth sharing.
          </div>
        </div>
      </div>
    </section>
  );
};

export { Footer24 };
