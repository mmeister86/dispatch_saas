"use client";

import { Check } from "lucide-react";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { cn } from "@/lib/utils";

interface PricingCards2CardsPlan {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  button: {
    text: string;
    url: string;
  };
  highlighted?: boolean;
  featureListLabel?: string;
  image?: string;
}

interface PricingCards2CardsProps {
  heading: string;
  description: string;
  plans: PricingCards2CardsPlan[];
  discount?: string;
  className?: string;
}

type Pricing7Props = PricingCards2CardsProps;
type Props = Partial<Pricing7Props>;

const defaultProps: Pricing7Props = {
  heading: "Pricing",
  description: "Check out our affordable pricing plans",
  plans: [
    {
      name: "Free",
      image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/pricing-plans/plan1.svg",
      description: "For individuals getting started",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      features: [
        "Single user",
        "Basic components library",
        "Community support",
        "1GB storage space",
      ],
      button: {
        text: "Get Started",
        url: "https://shadcnblocks.com",
      },
    },
    {
      name: "Pro",
      image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/pricing-plans/plan2.svg",
      description: "For professionals",
      monthlyPrice: "$49",
      yearlyPrice: "$359",
      features: [
        "Up to 5 team members",
        "Advanced components library",
        "Priority support",
        "2GB storage space",
        "Team collaboration",
        "Custom branding",
      ],
      button: {
        text: "Purchase",
        url: "https://shadcnblocks.com",
      },
      highlighted: true,
    },
  ],
};

const Pricing7 = (props: Props) => {
  const id = useId();
  const { heading, description, discount, plans, className } = {
    ...defaultProps,
    ...props,
  };

  const [isAnnually, setIsAnnually] = useState(false);
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="mx-auto mb-5 max-w-5xl text-center">
          <h2 className="mb-4 text-4xl font-semibold tracking-tight lg:text-5xl">
            {heading}
          </h2>
          <p className="text-muted-foreground lg:text-lg">{description}</p>
        </div>
        <div className="flex flex-col items-center gap-10">
          <div className="inline-flex h-9 max-w-full min-w-56 items-stretch rounded-md bg-muted p-1 text-sm">
            <RadioGroup
              defaultValue="monthly"
              className="flex h-full min-h-0 w-full gap-0"
              onValueChange={(value: string) => {
                setIsAnnually(value === "annually");
              }}
            >
              <div className="relative flex h-full min-h-0 min-w-0 flex-1 basis-0 rounded-md transition-all has-[button[data-state=checked]]:bg-background">
                <RadioGroupItem
                  value="monthly"
                  id={`${id}-monthly`}
                  aria-label="Monthly billing"
                  className={cn(
                    "absolute inset-0 z-10 m-0 size-full min-h-0 min-w-0 cursor-pointer appearance-none border-0 bg-transparent p-0 opacity-0 shadow-none ring-0 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                />
                <span className="pointer-events-none relative z-0 flex w-full items-center justify-center px-3 font-medium whitespace-nowrap text-muted-foreground">
                  Monthly
                </span>
              </div>
              <div className="relative flex h-full min-h-0 min-w-0 flex-1 basis-0 rounded-md transition-all has-[button[data-state=checked]]:bg-background">
                <RadioGroupItem
                  value="annually"
                  id={`${id}-annually`}
                  aria-label={
                    discount
                      ? `Yearly billing, ${discount} discount`
                      : "Yearly billing"
                  }
                  className={cn(
                    "absolute inset-0 z-10 m-0 size-full min-h-0 min-w-0 cursor-pointer appearance-none border-0 bg-transparent p-0 opacity-0 shadow-none ring-0 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                />
                <span className="pointer-events-none relative z-0 flex w-full items-center justify-center gap-1.5 px-3 font-medium whitespace-nowrap text-muted-foreground">
                  Yearly
                  {discount && (
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-100 px-1 py-0 text-xs text-green-600"
                    >
                      {discount}
                    </Badge>
                  )}
                </span>
              </div>
            </RadioGroup>
          </div>
          <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-4 md:flex-row md:items-stretch md:justify-center">
            {(plans ?? []).map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "flex w-full max-w-full min-w-0 flex-col rounded-lg bg-card p-6 md:flex-1 md:basis-0",
                  plan.highlighted
                    ? "border-2 border-primary"
                    : "border border-border",
                )}
              >
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <h3 className="mb-1.5 text-lg font-semibold">
                      {plan.name}
                    </h3>
                    <div className="mb-5 flex min-w-0 flex-wrap items-end gap-x-1">
                      <span className="min-w-0 text-4xl font-medium tracking-tight">
                        {isAnnually ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-xl font-normal text-muted-foreground">
                        {isAnnually ? "/per year" : "/per month"}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                    {plan.featureListLabel ? (
                      <p className="mt-8 mb-3 font-semibold">
                        {plan.featureListLabel}
                      </p>
                    ) : null}
                    <ul
                      className={cn(
                        "flex flex-col gap-3",
                        !plan.featureListLabel && "mt-8",
                      )}
                    >
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex gap-2">
                          <Check className="mt-1 size-4 shrink-0" />
                          <span className="min-w-0 wrap-break-word">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    asChild
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <a href={plan.button.url}>{plan.button.text}</a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing7 };
