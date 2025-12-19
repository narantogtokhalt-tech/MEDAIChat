// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 🔐 Global admin guard
 *  - Not logged in   → /login
 *  - role !== admin  → /
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // ❌ not authenticated
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin/users")}`);
  }

  const role = (session.user as any)?.role;

  // ❌ authenticated but not admin
  if (role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}