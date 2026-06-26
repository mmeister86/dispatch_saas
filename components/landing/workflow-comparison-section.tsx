import { Check, Minus } from "lucide-react";

const rows = [
  ["Pulls your commits automatically", "No", "Yes"],
  ["Knows your build context", "No", "Yes"],
  ["Build-in-public voice by default", "No", "Yes"],
  ["One-click post to X", "No", "Yes"],
  ["Time per tweet", "~10 min", "~20 sec"],
  ["Survives past week 1", "rarely", "Yes"],
];

export function WorkflowComparisonSection({ id }: { id: string }) {
  return (
    <section className="py-(--space-section)" id={id}>
      <div className="container">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Comparison
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
            Dispatch beats the copy-paste workflow.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            ChatGPT + copy-paste can rewrite a prompt. Dispatch turns your real commits into build-in-public drafts without the manual loop.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto border border-border bg-card">
          <div className="grid min-w-[720px] grid-cols-[1.2fr_0.9fr_0.9fr]">
            <div className="border-b border-border p-4" />
            <div className="border-b border-border p-4 font-semibold">
              ChatGPT + copy-paste
            </div>
            <div className="border-b border-border bg-secondary p-4 font-semibold">
              Dispatch
            </div>
            {rows.map(([feature, manual, dispatch]) => (
              <div className="contents" key={feature}>
                <div className="border-b border-border p-4 font-medium">
                  {feature}
                </div>
                <div className="flex items-center gap-2 border-b border-border p-4 text-muted-foreground">
                  {manual === "No" ? <Minus className="size-4" /> : null}
                  {manual}
                </div>
                <div className="flex items-center gap-2 border-b border-border bg-secondary p-4 font-medium">
                  {dispatch === "Yes" ? <Check className="size-4 text-accent" /> : null}
                  {dispatch}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
