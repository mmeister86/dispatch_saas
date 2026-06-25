"use client";

import { startTransition, useEffect, useState } from "react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
            Teams are thriving with our platform
          </h2>
          <Carousel setApi={setApi} className="w-full lg:hidden">
            <CarouselContent>
              <CarouselItem>
                <div className="rounded-2xl border p-8 select-none">
                  <img
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcn-ui-wordmark.svg"
                    alt="logo"
                    className="mb-6 h-5 dark:invert"
                  />
                  <p className="mb-10 text-xl font-semibold">
                    Our team has seen an incredible boost in productivity since
                    adopting this platform. It&apos;s a game-changer.
                  </p>
                  <div className="mb-3 flex gap-4">
                    <Avatar className="size-12 rounded-full ring-1 ring-input">
                      <AvatarImage
                        src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp"
                        alt="avatar"
                      />
                    </Avatar>
                    <div>
                      <p className="font-medium">Sarah Williams</p>
                      <p className="text-muted-foreground">
                        Head of Product, @company
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="rounded-2xl border p-8 select-none">
                  <img
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/nextjs-wordmark.svg"
                    alt="logo"
                    className="mb-6 h-9 dark:invert"
                  />
                  <p className="mb-10 text-xl font-semibold">
                    This tool has streamlined our development process and
                    improved team collaboration like never before.
                  </p>
                  <div className="mb-3 flex gap-4">
                    <Avatar className="size-12 rounded-full ring-1 ring-input">
                      <AvatarImage
                        src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp"
                        alt="avatar"
                      />
                    </Avatar>
                    <div>
                      <p className="font-medium">David Parker</p>
                      <p className="text-muted-foreground">CTO, @company</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="rounded-2xl border p-8 select-none">
                  <img
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/tailwind-wordmark-white.svg"
                    alt="logo"
                    className="mb-6 h-4 lg:h-5"
                  />
                  <p className="mb-10 text-xl font-semibold">
                    We have reduced our development cycles by 33.2% thanks to
                    the efficiency this platform brings to us.
                  </p>
                  <div className="mb-3 flex gap-4">
                    <Avatar className="size-12 rounded-full ring-1 ring-input">
                      <AvatarImage
                        src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-3.webp"
                        alt="avatar"
                      />
                    </Avatar>
                    <div>
                      <p className="font-medium">Maria Gonzalez</p>
                      <p className="text-muted-foreground">
                        Lead Developer, @company
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
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
            <div className="rounded-2xl border p-8">
              <img
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcn-ui-wordmark.svg"
                alt="logo"
                className="mb-6 h-6 dark:invert"
              />
              <p className="mb-10 text-xl font-semibold">
                Our team has seen an incredible boost in productivity since
                adopting this platform. It&apos;s a game-changer for us!
              </p>
              <div className="mb-3 flex gap-4">
                <Avatar className="size-12 rounded-full ring-1 ring-input">
                  <AvatarImage
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp"
                    alt="avatar"
                  />
                </Avatar>
                <div>
                  <p className="font-medium">Sarah Williams</p>
                  <p className="text-muted-foreground">
                    Head of Product, @company
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border p-8">
                <img
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/nextjs-wordmark.svg"
                  alt="logo"
                  className="mb-6 h-8 dark:invert"
                />
                <p className="mb-10 text-xl font-semibold">
                  This tool has streamlined our development process and improved
                  team collaboration like never before.
                </p>
                <div className="mb-3 flex gap-4">
                  <Avatar className="size-12 rounded-full ring-1 ring-input">
                    <AvatarImage
                      src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp"
                      alt="avatar"
                    />
                  </Avatar>
                  <div>
                    <p className="font-medium">David Parker</p>
                    <p className="text-muted-foreground">CTO, @company</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border p-8">
                <img
                  src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/tailwind-wordmark-black.svg"
                  alt="logo"
                  className="mb-6 h-4 dark:invert"
                />
                <p className="mb-10 text-xl font-semibold">
                  We’ve reduced our development cycles by 30% thanks to the
                  efficiency this platform brings.
                </p>
                <div className="mb-3 flex gap-4">
                  <Avatar className="size-12 rounded-full ring-1 ring-input">
                    <AvatarImage
                      src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-3.webp"
                      alt="avatar"
                    />
                  </Avatar>
                  <div>
                    <p className="font-medium">Maria Gonzalez</p>
                    <p className="text-muted-foreground">
                      Lead Developer, @company
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Testimonial17 };
