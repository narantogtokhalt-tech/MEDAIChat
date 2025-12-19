"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { navigations } from "@/config/site";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = role === "admin";

  const items = navigations.filter((nav) => {
    // ✅ /admin/* route-ууд зөвхөн admin-д харагдана
    if (typeof nav.href === "string" && nav.href.startsWith("/admin")) {
      return isAdmin;
    }
    return true;
  });

  return (
    <nav className="flex flex-grow flex-col gap-y-1 p-2">
      {items.map((navigation) => {
        const Icon = navigation.icon;
        const active = pathname === navigation.href;

        return (
          <Link
            key={navigation.name}
            href={navigation.href}
            className={cn(
              "flex items-center rounded-md px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800",
              active ? "bg-slate-200 dark:bg-slate-800" : "bg-transparent",
            )}
          >
            <Icon size={16} className="mr-2 text-slate-800 dark:text-slate-200" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {navigation.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}