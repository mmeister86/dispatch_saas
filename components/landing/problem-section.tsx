export function ProblemSection({ id }: { id: string }) {
  return (
    <section className="py-(--space-section)" id={id}>
      <div className="container grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-end">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Problem
        </p>
        <div>
          <h2 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
            You keep shipping, but your audience never sees the progress.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Every meaningful commit can build trust. Most of them stay buried in GitHub.
          </p>
        </div>
      </div>
    </section>
  );
}
