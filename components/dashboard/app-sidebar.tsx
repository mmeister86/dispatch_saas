"use client";

import { UserButton } from "@clerk/nextjs";
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

const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/drafts", label: "Drafts" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const access = useQuery(api.billing.currentAccess);
  const plan = access?.state === "active" ? access.plan : null;
  const postsRemaining =
    access?.state === "active" ? access.postsRemaining : null;

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <Link className="block" href="/dashboard">
          <p className="text-sm font-semibold text-emerald-700">Dispatch</p>
          <p className="mt-1 text-base font-semibold tracking-normal">
            Build-in-public desk
          </p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
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
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-2">
          <div className="min-w-0">
            <p className="text-xs font-medium capitalize text-zinc-500">
              {plan ? `${plan} plan` : "Account"}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-950">
              {postsRemaining === null
                ? "Checking access"
                : `${postsRemaining} posts left`}
            </p>
          </div>
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
