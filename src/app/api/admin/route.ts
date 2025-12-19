// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8010";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || "secret123";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const accessToken = (session as any)?.accessToken as string | null;

  if (!session) return { ok: false as const, status: 401, msg: "Unauthorized" };
  if (role !== "admin") return { ok: false as const, status: 403, msg: "Admin only" };
  if (!accessToken)
    return { ok: false as const, status: 401, msg: "Missing access token" };

  return { ok: true as const, accessToken };
}

export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ detail: a.msg }, { status: a.status });

  const r = await fetch(`${BACKEND_URL}/auth/users`, {
    method: "GET",
    headers: {
      "x-api-key": BACKEND_API_KEY,
      Authorization: `Bearer ${a.accessToken}`,
    },
    cache: "no-store",
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ detail: a.msg }, { status: a.status });

  const body = await req.text();

  const r = await fetch(`${BACKEND_URL}/auth/users`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": BACKEND_API_KEY,
      Authorization: `Bearer ${a.accessToken}`,
    },
    body,
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}