// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const data = await getDashboardData();

    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
        "x-dashboard": "ok",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "dashboard_failed", message: err?.message ?? String(err) },
      { status: 500, headers: { "cache-control": "no-store", "x-dashboard": "fail" } }
    );
  }
}