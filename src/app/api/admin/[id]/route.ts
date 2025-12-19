// src/app/api/admin/[id]/route.ts
import { NextResponse } from "next/server";

const CHAT_API_BASE =
  process.env.NEXT_PUBLIC_CHAT_API_BASE || "http://127.0.0.1:8010";

// ❗Эдгээрийг Frontend repo дээр бол NEXT_PUBLIC биш, server-only env байлгах нь зөв.
// Vercel дээр Environment Variables-д нэмээрэй.
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || process.env.NEXT_PUBLIC_BACKEND_API_KEY || "secret123";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN || "dev-admin-token";

type Ctx = { params: Promise<{ id: string }> };

function backendHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": BACKEND_API_KEY,
    Authorization: `Bearer ${ADMIN_TOKEN}`,
  };
}

export async function PATCH(req: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const url = `${CHAT_API_BASE}/auth/users/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: backendHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      { detail: e?.message ?? "Proxy PATCH failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, context: Ctx) {
  try {
    const { id } = await context.params;

    const url = `${CHAT_API_BASE}/auth/users/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: backendHeaders(),
      cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      { detail: e?.message ?? "Proxy DELETE failed" },
      { status: 500 },
    );
  }
}