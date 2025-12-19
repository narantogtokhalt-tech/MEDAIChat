"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function SessionMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  const isAdmin = session.user.role === "admin";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-muted"
      >
        <span className="font-medium">{session.user.name}</span>
        <span className="text-xs text-muted-foreground">
          ({session.user.role})
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-background shadow-lg z-50">
          <div className="px-4 py-3 text-sm border-b">
            <div className="font-medium">{session.user.name}</div>
            <div className="text-xs text-muted-foreground">
              {session.user.email}
            </div>
          </div>

          {isAdmin && (
            <a
              href="/admin/users"
              className="block px-4 py-2 text-sm hover:bg-muted"
            >
              👤 User management
            </a>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}