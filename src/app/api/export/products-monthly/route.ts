// src/app/api/export/products-monthly/route.ts
import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_CHAT_API_BASE;

export async function GET() {
  if (!backend) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CHAT_API_BASE is not set" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `${backend}/dashboard/export/products-timeline`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    // FastAPI-гаас: { products: [...], monthly: [...] }
    const monthly: any[] = data.monthly ?? [];
    const productCodes: string[] =
      data.products?.map((p: any) => p.code) ?? ["2601", "2603", "2701", "2709"];

    // TicketMetric[] => { date, type, count }
    const metrics: { date: string; type: string; count: number }[] = [];

    for (const row of monthly) {
      const period =
        row.period ??
        `${row.year}-${String(row.month).padStart(2, "0")}`;
      const date = `${period}-01`; // "2025-11-01" хэлбэр

      for (const code of productCodes) {
        const value = row[code];
        if (value == null) continue;

        const num = Number(value);
        if (!Number.isFinite(num)) continue;

        const rounded = Math.round(num); // ← бүхэл тоо болгов

        metrics.push({
          date,
          type: code,
          count: rounded,
        });
      }
    }

    return NextResponse.json(metrics);
  } catch (err) {
    console.error("export/products-monthly API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products timeline" },
      { status: 500 },
    );
  }
}