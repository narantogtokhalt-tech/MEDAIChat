// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

// Vercel runtime hints (удаан backend-тэй үед хэрэгтэй)
export const runtime = "nodejs";
export const maxDuration = 30;

// ✅ Route-level ISR (cache-г энд л хийж байна)
export const revalidate = 60;

const BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || "";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    const data = await getDashboardData();

    return NextResponse.json(debug ? { base: BASE, ...data } : data, {
      headers: {
        "x-dashboard": "ok",
        // Vercel CDN cache
        "cache-control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "dashboard_failed",
        message: err?.message ?? String(err),
        ...(debug ? { base: BASE } : {}),
      },
      {
        status: 500,
        headers: {
          "x-dashboard": "fail",
          // алдааг cache-лахгүй
          "cache-control": "no-store",
        },
      }
    );
  }
}