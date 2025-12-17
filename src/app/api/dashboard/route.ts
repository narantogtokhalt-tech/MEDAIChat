// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

// ISR (route-level)
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  const base =
    process.env.NEXT_PUBLIC_CHAT_API_BASE || "";

  try {
    const data = await getDashboardData();

    return NextResponse.json(
      debug ? { base, ...data } : data,
      {
        headers: {
          "x-dashboard": "ok",
          // CDN-д cache policy-г илүү тодорхой болгоно
          // (ISR ажиллаж байгаа үед ихэнхдээ зүгээр, гэхдээ тодорхой болгож өгнө)
          "cache-control": "s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      debug
        ? { base, error: "dashboard_failed", message: err?.message ?? String(err) }
        : { error: "dashboard_failed", message: err?.message ?? String(err) },
      {
        status: 500,
        headers: {
          "x-dashboard": "fail",
          // Алдааг cache-лахгүй
          "cache-control": "no-store",
        },
      }
    );
  }
}