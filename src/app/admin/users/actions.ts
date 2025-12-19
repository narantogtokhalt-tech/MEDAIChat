// src/app/admin/users/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8010";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || "secret123";

async function requireAdmin() {
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

export async function createUserAction(formData: FormData) {
  const { accessToken } = await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = (String(formData.get("role") || "user") as "admin" | "user");

  if (!name || !email || !password) throw new Error("Name, email, password required");

  await backendFetch("/auth/users", accessToken, {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });

  revalidatePath("/admin/users");
}

export async function toggleDisabledAction(formData: FormData) {
  const { accessToken } = await requireAdmin();

  const id = String(formData.get("id") || "");
  const disabled = String(formData.get("disabled") || "false") === "true";
  if (!id) throw new Error("Missing user id");

  await backendFetch(`/auth/users/${encodeURIComponent(id)}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ disabled }),
  });

  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const { accessToken } = await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing user id");

  await backendFetch(`/auth/users/${encodeURIComponent(id)}`, accessToken, {
    method: "DELETE",
  });

  revalidatePath("/admin/users");
}