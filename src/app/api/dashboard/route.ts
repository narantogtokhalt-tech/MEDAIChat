import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

// ISR
export const revalidate = 60;

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data, {
      headers: {
        "x-dashboard": "ok",
        "cache-control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "dashboard_failed", message: err?.message ?? String(err) },
      { status: 500, headers: { "cache-control": "no-store", "x-dashboard": "fail" } }
    );
  }
}