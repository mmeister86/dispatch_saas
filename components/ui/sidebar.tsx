"use client";

import * as React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SidebarProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-zinc-50 text-zinc-950", className)}>
      {children}
    </div>
  );
}

export function SidebarInset({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("min-w-0 flex-1 bg-zinc-50", className)}>
      {children}
    </main>
  );
}

export function Sidebar({
  children,
  className,
  collapsible = "offcanvas",
}: {
  children: React.ReactNode;
  className?: string;
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-b border-zinc-200 bg-white text-zinc-950 md:min-h-screen md:w-64 md:border-b-0 md:border-r",
        className,
      )}
      data-collapsible={collapsible}
      data-slot="sidebar"
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-zinc-200 p-4", className)}>
      {children}
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-5 p-3", className)}>
      {children}
    </div>
  );
}

export function SidebarFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-zinc-200 p-3", className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("grid gap-2", className)}>{children}</section>;
}

export function SidebarGroupLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "px-2 text-xs font-semibold uppercase tracking-normal text-zinc-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SidebarMenu({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ul className={cn("grid gap-1", className)}>{children}</ul>;
}

export function SidebarMenuItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={className}>{children}</li>;
}

export function SidebarMenuButton({
  children,
  className,
  isActive = false,
}: {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex min-h-10 items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-current transition-colors hover:bg-zinc-100",
        isActive && "bg-zinc-950 hover:bg-zinc-900",
        className,
      )}
      data-active={isActive}
      data-slot="sidebar-menu-button"
    >
      {children}
    </span>
  );
}
