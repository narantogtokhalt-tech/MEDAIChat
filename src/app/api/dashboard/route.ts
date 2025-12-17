// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

// ✅ Route-level ISR
export const revalidate = 60;

const BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || "";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    const data = await getDashboardData();

    // ✅ OK response: CDN cache + stale-while-revalidate
    return NextResponse.json(
      debug ? { base: BASE, ...data } : data,
      {
        headers: {
          "x-dashboard": "ok",
          "cache-control": "s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    // ✅ Error response: never cache
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
          "cache-control": "no-store",
        },
      }
    );
  }
}