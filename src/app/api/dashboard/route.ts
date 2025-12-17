// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardData } from "@/data/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || "";

function join(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function probe(path: string) {
  const url = join(BASE, path);
  const t0 = Date.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    const ms = Date.now() - t0;

    const text = await res.text().catch(() => "");
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }

    return {
      ok: res.ok,
      status: res.status,
      ms,
      url,
      // payload-оос жижиг sample л буцаана (том JSON-оос хамгаалж)
      sample:
        json?.monthly
          ? { monthlyLen: json.monthly.length, firstRow: json.monthly[0] }
          : json?.commodities
          ? { commoditiesLen: json.commodities.length, first: json.commodities[0] }
          : Array.isArray(json)
          ? { arrayLen: json.length, first: json[0] }
          : json && typeof json === "object"
          ? { keys: Object.keys(json).slice(0, 20) }
          : { textHead: text.slice(0, 120) },
    };
  } catch (e: any) {
    const ms = Date.now() - t0;
    return {
      ok: false,
      status: 0,
      ms,
      url,
      error: e?.message ?? String(e),
    };
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const debug = u.searchParams.get("debug") === "1";

  try {
    if (debug) {
      // ✅ яг аль endpoint унаж байгааг ил гаргана
      const [pt, pvm, et, ex, coal] = await Promise.all([
        probe("/dashboard/export/products-timeline"),
        probe("/dashboard/export/products-value-monthly"),
        probe("/dashboard/export/total"),
        probe("/dashboard/exchange/timeline"),
        probe("/dashboard/coal-cny/latest"),
      ]);

      return NextResponse.json(
        {
          base: BASE,
          probes: {
            productsTimeline: pt,
            productsValueMonthly: pvm,
            exportTotal: et,
            exchangeTimeline: ex,
            coalLatest: coal,
          },
        },
        { headers: { "cache-control": "no-store", "x-dashboard": "debug" } }
      );
    }

    const data = await getDashboardData();
    return NextResponse.json(data, {
      headers: { "cache-control": "no-store", "x-dashboard": "ok" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "dashboard_failed", message: err?.message ?? String(err), base: BASE },
      { status: 500, headers: { "cache-control": "no-store", "x-dashboard": "fail" } }
    );
  }
}