"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface Contact14Props {
  className?: string;
  onSubmit?: (data: ContactFormData) => Promise<void>;
}

const Contact14 = ({ className, onSubmit }: Contact14Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        console.log("Form submitted:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setIsSubmitted(true);
      setShowSuccess(true);
      form.reset();
      setTimeout(() => setShowSuccess(false), 4500);
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      form.setError("root", {
        message: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <section className={cn("bg-background py-32", className)}>
      <div className="container">
        <Card className="w-full rounded-4xl border-none bg-muted">
          <CardContent className="relative overflow-hidden py-12 lg:px-18 lg:py-24">
            <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
              <div className="flex flex-col justify-center space-y-6">
                <p className="text-sm font-semibold tracking-tight text-muted-foreground">
                  SHADCNBLOCKS.COM
                </p>
                <div className="relative flex size-30 items-center justify-center rounded-3xl bg-foreground p-2.5 shadow-xl">
                  <div className="flex size-full items-center justify-center rounded-2xl bg-background p-4">
                    <Avatar className="size-full">
                      <AvatarImage
                        src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp"
                        alt="avatar"
                        className="object-cover"
                      />
                      <AvatarFallback>Shadcn</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <h1 className="text-5xl font-bold tracking-tighter text-foreground">
                  Contact Us
                </h1>

                <ul className="max-w-lg space-y-2 tracking-tight">
                  <li className="flex items-center">
                    <span className="mr-2 font-bold">Email:</span>{" "}
                    <span className="text-foreground/80 underline">
                      example@shadcnblocks.com
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 font-bold">Phone:</span>{" "}
                    <span className="text-foreground/80">
                      +1 (555) 123-4567
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 font-bold">Address:</span>
                    <span className="text-foreground/80">
                      123 Design Street, UI City
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 font-bold">Hours:</span>{" "}
                    <span className="text-foreground/80">
                      Mon-Fri, 9am-5pm EST
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 flex h-auto flex-col gap-2 space-y-3 md:pl-3">
                {isSubmitted && (
                  <div
                    className={cn(
                      "rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center transition-opacity duration-500",
                      showSuccess ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Thank you! We&apos;ll be in touch soon.
                    </p>
                  </div>
                )}

                <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                  <FieldGroup>
                    <Controller
                      control={form.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name} className="sr-only">
                            Name
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            placeholder="Name"
                            className="bg-background p-6"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="phone"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name} className="sr-only">
                            Phone
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            type="tel"
                            aria-invalid={fieldState.invalid}
                            placeholder="Phone"
                            className="bg-background p-6"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {form.formState.errors.root && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.root.message}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="h-10 w-fit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <LoaderIcon className="mr-2 size-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Contact Us"
                      )}
                    </Button>
                  </FieldGroup>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export { Contact14 };
