import type { LucideIcon } from "lucide-react";
import { CalendarX, GitCommit, MessageSquareText, Send } from "lucide-react";

import { cn } from "@/lib/utils";

interface FaqItem {
  icon: LucideIcon;
  heading: string;
  description: string;
}

interface Faq15Props {
  title?: string;
  items?: FaqItem[];
  className?: string;
}

const defaultItems: FaqItem[] = [
  {
    icon: Send,
    heading: "Does Dispatch post automatically?",
    description:
      "No. Dispatch creates the draft. You review it, edit if needed, and decide when to post.",
  },
  {
    icon: GitCommit,
    heading: "Is this just a ChatGPT wrapper?",
    description:
      "No. Dispatch starts with your GitHub commit, pulls the context, finds the build-in-public angle, and gives you post-ready variants.",
  },
  {
    icon: CalendarX,
    heading: "Do I need a content calendar?",
    description:
      "No. Dispatch is built around your actual shipping rhythm, not a separate posting schedule.",
  },
  {
    icon: MessageSquareText,
    heading: "Is there a free plan?",
    description:
      "No. Dispatch is paid from day one so the product can stay focused on people who are actively building and posting.",
  },
];

const Faq15 = ({
  title = "Questions before your first draft?",
  items = defaultItems,
  className,
}: Faq15Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-semibold md:text-5xl lg:mx-14">
            {title}
          </h2>
          <ul className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            {items.map((item, idx) => (
              <li className="flex flex-col gap-2.5" key={idx}>
                <div className="flex items-center gap-2 md:gap-2.5">
                  <item.icon className="size-5 shrink-0 md:size-6" />
                  <h3 className="font-semibold md:text-lg">{item.heading}</h3>
                </div>
                <p className="text-sm text-muted-foreground md:text-base">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export { Faq15 };
