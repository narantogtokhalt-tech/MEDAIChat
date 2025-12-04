// src/app/api/export/total/route.ts
import { NextResponse } from "next/server";

const backend = process.env.BACKEND_URL;

export async function GET() {
  if (!backend) {
    return NextResponse.json(
      { error: "BACKEND_URL is not set" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${backend}/dashboard/export/total`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    // FastAPI: { date, export_this_year, export_prev_same_day, yoy_pct }
    return NextResponse.json(data);
  } catch (err) {
    console.error("export/total API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch export total" },
      { status: 500 },
    );
  }
}