import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 text-zinc-950">
      <section className="grid w-full max-w-md gap-8">
        <Link className="w-fit" href="/">
          <p className="text-sm font-semibold text-emerald-700">Dispatch</p>
          <p className="mt-1 text-xl font-semibold tracking-normal">
            Build-in-public desk
          </p>
        </Link>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
        />
      </section>
    </main>
  );
}
