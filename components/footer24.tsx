import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

const footerData = {
  heading: "Shadcnblocks",
  email: {
    label: "example@shadcnblocks.com",
    href: "#",
  },
  phone: {
    label: "(123) 456 789",
    href: "tel:+1234567890",
  },
  socialLinks: [
    { label: "Twitter", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "TikTok", href: "#" },
    { label: "Facebook", href: "#" },
  ],
  navLinks: [
    { label: "Home", href: "#" },
    { label: "Photos", href: "#" },
    { label: "Videos", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "#" },
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
          <div className="mb-6 border-b border-border pb-6 text-left md:mb-8 md:pb-8 md:text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl">
              {footerData.heading}
            </h1>
          </div>

          <div className="mb-12 flex flex-col gap-8 md:mb-16 lg:flex-row lg:justify-between lg:gap-4 xl:gap-8">
            {/* Email Section */}
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-sm font-medium tracking-wide text-primary uppercase">
                Email
              </h3>
              <a
                href={footerData.email.href}
                className="flex items-center gap-2 text-base text-muted-foreground transition-colors hover:text-primary md:text-lg"
              >
                {footerData.email.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            {/* Social Links Section */}
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-sm font-medium tracking-wide text-primary uppercase">
                Follow Us
              </h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

            {/* Phone Section */}
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-sm font-medium tracking-wide text-primary uppercase">
                Phone
              </h3>
              <a
                href={footerData.phone.href}
                className="flex items-center gap-2 text-base text-muted-foreground transition-colors hover:text-primary md:text-lg"
              >
                {footerData.phone.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-6 py-6 md:flex-row md:items-center md:justify-between md:py-4">
          <nav className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
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
            Designed in <strong>San Francisco</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Footer24 };
