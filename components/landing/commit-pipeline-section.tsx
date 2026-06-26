const steps = [
  {
    title: "Connect GitHub",
    body: "Choose the repo Dispatch should watch for meaningful product progress.",
  },
  {
    title: "Push a commit",
    body: "Ship normally. Dispatch reads the update and looks for the build-in-public angle.",
  },
  {
    title: "Pick the draft worth posting",
    body: "Review the strongest version, adjust a word if needed, and keep your build log alive.",
  },
];

export function CommitPipelineSection({ id }: { id: string }) {
  return (
    <section className="py-(--space-section)" id={id}>
      <div className="container">
        <div className="grid gap-5 border-y border-border py-8 md:grid-cols-[0.75fr_1.25fr] md:items-center">
          <h2 className="text-3xl font-semibold tracking-normal md:text-5xl">
            How it works
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            A quiet pipeline from real shipping activity to something you would actually post.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article className="border border-border bg-card p-5" key={step.title}>
              <p className="font-heading text-5xl font-semibold text-accent">
                0{index + 1}
              </p>
              <h3 className="mt-8 text-2xl font-semibold tracking-normal">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
