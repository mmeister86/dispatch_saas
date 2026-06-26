import { faqItems } from "@/components/landing/landing-data";

export function FaqSection({ id }: { id: string }) {
  return (
    <section className="py-(--space-section)" id={id}>
      <div className="container grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <h2 className="text-4xl font-semibold tracking-normal md:text-5xl">
          Questions before your first draft?
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {faqItems.map((item) => (
            <article className="border-t border-border pt-5" key={item.question}>
              <h3 className="text-lg font-semibold tracking-normal">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
