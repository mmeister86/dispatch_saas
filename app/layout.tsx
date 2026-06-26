import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";
import { Archivo, Commissioner, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});
const commissioner = Commissioner({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-sans",
});

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
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        "font-sans",
        geist.variable,
        archivo.variable,
        commissioner.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          signInUrl="/login"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
        <Script
          src="https://rybbit.matthias.lol/api/script.js"
          data-site-id="956f13b96802"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
