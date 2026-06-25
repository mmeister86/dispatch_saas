"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/drafts", label: "Drafts" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const access = useQuery(api.billing.currentAccess);
  const onboardingStatus = useQuery(api.onboarding.status);
  const plan = access?.state === "active" ? access.plan : null;
  const postsRemaining =
    access?.state === "active" ? access.postsRemaining : null;
  const waitingForAccess =
    !isLoaded ||
    access === undefined ||
    (access?.state === "signedOut" && isSignedIn);
  const dashboardSidebarLoading =
    pathname === "/dashboard" &&
    access?.state === "active" &&
    onboardingStatus === undefined;
  const sidebarLoading = waitingForAccess || dashboardSidebarLoading;
  const signedOut = isLoaded && isSignedIn === false;

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        {sidebarLoading ? (
          <SidebarHeaderSkeleton />
        ) : (
          <Link className="block" href="/dashboard">
            <p className="text-sm font-semibold text-emerald-700">Dispatch</p>
            <p className="mt-1 text-base font-semibold tracking-normal">
              Build-in-public desk
            </p>
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        {sidebarLoading ? (
          <SidebarSkeleton />
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {primaryNavigation.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "block rounded-md text-white"
                          : "block rounded-md text-zinc-700 hover:text-zinc-950"
                      }
                      href={item.href}
                    >
                      <SidebarMenuButton isActive={active}>
                        {item.label}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {sidebarLoading ? (
          <SidebarFooterSkeleton />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-2">
            <div className="min-w-0">
              <p className="text-xs font-medium capitalize text-zinc-500">
                {plan ? `${plan} plan` : "Account"}
              </p>
              {postsRemaining !== null ? (
                <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                  {postsRemaining} posts left
                </p>
              ) : null}
            </div>
            {signedOut ? (
              <SignInButton mode="modal">
                <button
                  className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-semibold text-white"
                  type="button"
                >
                  Sign in
                </button>
              </SignInButton>
            ) : (
              <UserButton />
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarHeaderSkeleton() {
  return (
    <div className="grid gap-2" aria-busy="true" aria-label="Loading sidebar">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-5 w-36" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <SidebarGroup aria-busy="true" aria-label="Loading navigation">
      <Skeleton className="mb-3 h-3 w-20" />
      <div className="grid gap-2">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton className="h-9 w-full rounded-md" key={item} />
        ))}
      </div>
    </SidebarGroup>
  );
}

function SidebarFooterSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading account"
      className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-2"
    >
      <div className="grid min-w-0 flex-1 gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
