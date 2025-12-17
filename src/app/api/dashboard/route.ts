// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

export const runtime = "nodejs";
export const maxDuration = 30;

// ISR
export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    const data = await getDashboardData(debug);

    return NextResponse.json(data, {
      headers: {
        "x-dashboard": debug ? "debug" : "ok",
        "cache-control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "dashboard_failed", message: err?.message ?? String(err) },
      { status: 500, headers: { "x-dashboard": "fail", "cache-control": "no-store" } }
    );
  }
}