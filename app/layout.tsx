import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL("https://usedispat.ch"),
  title: "Dispatch - Turn commits into posts worth sharing",
  description:
    "Dispatch reads your GitHub commits and turns them into build-in-public drafts you can actually post.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dispatch - Turn commits into posts worth sharing",
    description:
      "Dispatch reads your GitHub commits and turns them into build-in-public drafts you can actually post.",
    url: "/",
    siteName: "Dispatch",
    images: [
      {
        url: "/og-dispatch.png",
        width: 1200,
        height: 630,
        alt: "Dispatch turns GitHub commits into build-in-public posts.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dispatch - Turn commits into posts worth sharing",
    description:
      "Dispatch reads your GitHub commits and turns them into build-in-public drafts you can actually post.",
    images: ["/og-dispatch.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          signInUrl="/login"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
