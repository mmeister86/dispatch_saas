import { CheckCircle, CircleMinus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Compare3Props {
  className?: string;
}

const COMPARISON_ROWS = [
  {
    feature: "Pulls your commits automatically",
    chatgpt: "No",
    dispatch: "Yes",
  },
  {
    feature: "Knows your build context",
    chatgpt: "No",
    dispatch: "Yes",
  },
  {
    feature: "Build-in-public voice by default",
    chatgpt: "No",
    dispatch: "Yes",
  },
  {
    feature: "One-click post to X",
    chatgpt: "No",
    dispatch: "Yes",
  },
  {
    feature: "Time per tweet",
    chatgpt: "~10 min",
    dispatch: "~20 sec",
  },
  {
    feature: "Survives past week 1",
    chatgpt: "rarely",
    dispatch: "Yes",
  },
];

const Compare3 = ({ className }: Compare3Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col items-center gap-4">
          <Badge variant="outline">Comparison</Badge>
          <h2 className="mx-auto max-w-2xl text-center text-4xl font-semibold sm:text-5xl">
            Dispatch beats the copy-paste workflow.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            ChatGPT + copy-paste can rewrite a prompt. Dispatch turns your real
            commits into build-in-public drafts without the manual loop.
          </p>
        </div>

        <div className="-mx-7 overflow-x-auto">
          <div className="mt-14 grid min-w-2xl grid-cols-3">
            <div className="border-b border-border p-5" />
            <div className="flex flex-col items-center justify-center gap-2 rounded-t-2xl border-b border-border p-5 text-center">
              <p className="text-lg font-semibold">ChatGPT + copy-paste</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Manual prompts, manual rewrites, manual posting
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 rounded-t-2xl border-b border-border bg-muted p-5 text-center">
              <p className="text-lg font-semibold">Dispatch</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Built for commits, context, and posting momentum
              </p>
            </div>

            {COMPARISON_ROWS.map((row, index) => {
              const isLastRow = index === COMPARISON_ROWS.length - 1;
              const borderClass = isLastRow ? "border-border" : "border-b border-border";

              return (
                <div className="contents" key={row.feature}>
                  <div
                    className={cn(
                      "flex items-center p-5 font-semibold",
                      borderClass,
                    )}
                  >
                    {row.feature}
                  </div>
                  <ComparisonValue
                    className={cn("p-5", borderClass)}
                    isPositive={false}
                    value={row.chatgpt}
                  />
                  <ComparisonValue
                    className={cn("bg-muted p-5", borderClass)}
                    isPositive
                    value={row.dispatch}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

function ComparisonValue({
  className,
  isPositive,
  value,
}: {
  className?: string;
  isPositive: boolean;
  value: string;
}) {
  const isBooleanValue = value === "Yes" || value === "No";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        className,
      )}
    >
      {isBooleanValue ? (
        isPositive ? (
          <CheckCircle className="size-5 text-green-600" />
        ) : (
          <CircleMinus className="size-5 text-red-600" />
        )
      ) : null}
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

export { Compare3 };
