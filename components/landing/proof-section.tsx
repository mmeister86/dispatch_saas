const proofSlots = [
  "A short quote from a builder who turns commits into publishable X drafts with Dispatch.",
  "A before-and-after note about replacing manual ChatGPT copy-paste with Dispatch.",
  "A concrete result from the first public commit-to-post workflow tested by a real builder.",
];

export function ProofSection({ id }: { id: string }) {
  return (
    <section className="py-(--space-section)" id={id}>
      <div className="container grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Proof
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
            Builder proof slots, ready for beta
          </h2>
        </div>
        <div className="grid gap-3">
          {proofSlots.map((slot, index) => (
            <article className="border border-border bg-card p-5" key={slot}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Reserved for beta proof
              </p>
              <p className="mt-4 text-lg font-medium leading-7">{slot}</p>
              <p className="mt-5 text-sm text-muted-foreground">
                Builder slot {index + 1} - Ready for real beta quote
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
