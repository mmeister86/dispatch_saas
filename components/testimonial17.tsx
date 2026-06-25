"use client";

import { startTransition, useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface Testimonial17Props {
  className?: string;
}

const mockedTestimonialSlots = [
  {
    id: "testimonial-slot-1",
    label: "Reserved for beta proof",
    quote:
      "This slot is ready for a short quote from a builder who turns commits into publishable X drafts with Dispatch.",
    name: "Builder slot 1",
    role: "Ready for real beta quote",
    initials: "B1",
  },
  {
    id: "testimonial-slot-2",
    label: "Reserved for beta proof",
    quote:
      "This slot is ready for a before-and-after note about replacing manual ChatGPT copy-paste with Dispatch.",
    name: "Builder slot 2",
    role: "Ready for real beta quote",
    initials: "B2",
  },
  {
    id: "testimonial-slot-3",
    label: "Reserved for beta proof",
    quote:
      "This slot is ready for a concrete result from the first public commit-to-post workflow tested by a real builder.",
    name: "Builder slot 3",
    role: "Ready for real beta quote",
    initials: "B3",
  },
];

const Testimonial17 = ({ className }: Testimonial17Props) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    startTransition(() => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);
    });

    api.on("select", () => {
      startTransition(() => {
        setCurrent(api.selectedScrollSnap() + 1);
      });
    });
  }, [api]);

  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col gap-14 lg:grid lg:grid-cols-3 lg:gap-0">
          <h2 className="text-center text-3xl font-bold lg:text-left lg:text-4xl">
            Builder proof slots, ready for beta
          </h2>
          <Carousel setApi={setApi} className="w-full lg:hidden">
            <CarouselContent>
              {mockedTestimonialSlots.map((slot) => (
                <CarouselItem key={slot.id}>
                  <TestimonialSlotCard slot={slot} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-8 flex justify-center">
              {Array.from({ length: count }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "mx-2 inline-block size-3 cursor-pointer rounded-full border-2",
                    index + 1 === current && "border-primary bg-primary",
                  )}
                  onClick={() => api && api.scrollTo(index)}
                />
              ))}
            </div>
          </Carousel>
          <div className="col-span-2 hidden grid-cols-2 items-center gap-6 lg:grid">
            <TestimonialSlotCard slot={mockedTestimonialSlots[0]} />
            <div className="flex flex-col gap-6">
              <TestimonialSlotCard slot={mockedTestimonialSlots[1]} />
              <TestimonialSlotCard slot={mockedTestimonialSlots[2]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function TestimonialSlotCard({
  slot,
}: {
  slot: (typeof mockedTestimonialSlots)[number];
}) {
  return (
    <div className="rounded-2xl border p-8 select-none">
      <p className="mb-6 text-sm font-medium uppercase tracking-normal text-muted-foreground">
        {slot.label}
      </p>
      <p className="mb-10 text-xl font-semibold">{slot.quote}</p>
      <div className="mb-3 flex gap-4">
        <Avatar className="size-12 rounded-full ring-1 ring-input">
          <AvatarFallback>{slot.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{slot.name}</p>
          <p className="text-muted-foreground">{slot.role}</p>
        </div>
      </div>
    </div>
  );
}

export { Testimonial17 };
