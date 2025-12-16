// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

// ✅ Route-level cache (ISR)
export const revalidate = 60;

export async function GET() {
  try {
    const data = await getDashboardData();

    // JSON response
    return NextResponse.json(data, {
      headers: {
        // optional: debugging/observability
        "x-dashboard": "ok",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "dashboard_failed",
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}