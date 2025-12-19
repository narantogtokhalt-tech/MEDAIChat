// src/app/admin/users/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createUserAction,
  toggleDisabledAction,
  deleteUserAction,
} from "./actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  disabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8010";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || "secret123";

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const accessToken = (session as any)?.accessToken as string | null;

  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent("/admin/users")}`);
  if (role !== "admin") redirect(`/`);
  if (!accessToken) redirect(`/login?callbackUrl=${encodeURIComponent("/admin/users")}`);

  return { accessToken };
}

async function backendFetch(path: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "content-type": "application/json",
      "x-api-key": BACKEND_API_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { detail: text };
        }
      })()
    : null;

  if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
  return data;
}

async function loadUsers(accessToken: string): Promise<UserRow[]> {
  const data = await backendFetch("/auth/users", accessToken, { method: "GET" });
  return (data?.users || []) as UserRow[];
}

export default async function AdminUsersPage() {
  const { accessToken } = await requireAdminSession();

  let users: UserRow[] = [];
  let loadErr: string | null = null;

  try {
    users = await loadUsers(accessToken);
  } catch (e: any) {
    loadErr = e?.message ?? "Failed to load users";
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin • User Management</h1>
        <p className="text-sm text-muted-foreground">
          Server Actions ашиглаж байна (browser дээр secret/token ил гарахгүй).
        </p>
      </div>

      {/* Create user */}
      <div className="rounded-2xl border bg-background p-5">
        <h2 className="text-lg font-medium mb-4">Add user</h2>

        <form
          action={createUserAction}
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          <input
            name="name"
            placeholder="Name"
            className="rounded-xl border bg-background px-4 py-3 outline-none"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="rounded-xl border bg-background px-4 py-3 outline-none"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="rounded-xl border bg-background px-4 py-3 outline-none"
            required
          />
          <select
            name="role"
            className="rounded-xl border bg-background px-4 py-3 outline-none"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button className="rounded-xl bg-primary text-primary-foreground font-medium">
            Create
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="rounded-2xl border bg-background overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="font-medium">Users ({users.length})</div>

          {/* refresh: simplest = full page reload */}
          <a
            href="/admin/users"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
          >
            Refresh
          </a>
        </div>

        {loadErr && (
          <div className="mx-4 mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            {loadErr}
          </div>
        )}

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const nextDisabled = !u.disabled;

                return (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <span className="rounded-full border px-2 py-1 text-xs">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.disabled ? (
                        <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs">
                          disabled
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-300/40 bg-emerald-100/30 px-2 py-1 text-xs">
                          active
                        </span>
                      )}
                    </td>
                    <td className="p-3">{fmtDate(u.created_at)}</td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <form action={toggleDisabledAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <input
                            type="hidden"
                            name="disabled"
                            value={String(nextDisabled)}
                          />
                          <button className="rounded-xl border px-3 py-1.5 text-xs hover:bg-muted">
                            {u.disabled ? "Enable" : "Disable"}
                          </button>
                        </form>

                        {/* NOTE: confirm хэрэгтэй бол дараагийн алхамд client confirm button component хийж өгнө */}
                        <form action={deleteUserAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs hover:bg-destructive/15">
                            Delete
                          </button>
                        </form>
                      </div>

                      <div className="mt-2 text-[11px] text-muted-foreground">
                        id: {u.id}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loadErr && (
                <tr>
                  <td colSpan={7} className="p-4 text-muted-foreground">
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}