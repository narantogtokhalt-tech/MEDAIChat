// src/data/dashboard.ts

import { getMetrics, type Metric } from "@/data/metrics";
import type { TicketMetric } from "@/types/types";
import type { Conversion } from "@/data/convertions";
import type { CoalResponse } from "@/components/chart-blocks/charts/customer-satisfication";

// -------- TicketByChannels --------
export type ProductsValuePieRow = {
  name: string;
  value: number;
  ton?: number;
  share?: number;
};

export type DashboardData = {
  metrics: Metric[] | null;

  // AverageTicketsCreated
  productsMonthly: TicketMetric[];

  // TicketByChannels
  productsValuePie: ProductsValuePieRow[];
  productsValueYearLabel: string;
  productsValueExportTotal: number | null;

  // Conversions
  exchangeTimeline: Conversion[] | null;

  // CustomerSatisfication
  coalLatest: CoalResponse | null;
};

const BASE =
  process.env.NEXT_PUBLIC_CHAT_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

function join(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const url = join(BASE, path);
  const res = await fetch(url, { method: "GET", cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed ${res.status} ${url} :: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ---- Backend response types (local) ----
type ProductsTimelineResp = {
  products?: Array<{ code: string; name?: string; unit?: string }>;
  monthly?: Array<{
    year?: number;
    month?: number;
    period?: string;
    [code: string]: any;
  }>;
};

type ExportTotalResp = {
  date: string;
  export_this_year: number | null;
  export_prev_same_day: number | null;
  yoy_pct: number | null;
};

type ProductsValueMonthlyResp =
  | ProductsValuePieRow[]
  | {
      products?: Array<{ code: string; name: string; unit?: string }>;
      monthly?: Array<{ year?: number; period?: string; [code: string]: any }>;
      yearLabel?: string;
      exportTotal?: number;
      data?: ProductsValuePieRow[];
    };

type ExchangeTimelineResp = {
  from?: string;
  to?: string;
  commodities?: Array<{
    key: string;
    name: string;
    total_ton: number;      // байж болно, гэхдээ бид share-д голлохгүй
    total_scaled: number;   // unit_scaled дагалдана
    unit_scaled: string;    // "сая тн" / "мян. тн" гэх мэт
  }>;
};

function toTons(totalScaled: number, unitScaled: string) {
  const u = (unitScaled || "").toLowerCase();
  if (u.includes("сая")) return totalScaled * 1_000_000;
  if (u.includes("мян")) return totalScaled * 1_000;
  return totalScaled;
}

export async function getDashboardData(): Promise<DashboardData> {
  const empty: DashboardData = {
    metrics: null,
    productsMonthly: [],
    productsValuePie: [],
    productsValueYearLabel: "",
    productsValueExportTotal: null,
    exchangeTimeline: null,
    coalLatest: null,
  };

  if (!BASE) return empty;

  const [
    metricsR,
    productsTimelineR,
    productsValueMonthlyR,
    exportTotalR,
    exchangeTimelineR,
    coalLatestR,
  ] = await Promise.allSettled([
    getMetrics(),
    fetchJSON<ProductsTimelineResp>("/dashboard/export/products-timeline"),
    fetchJSON<ProductsValueMonthlyResp>("/dashboard/export/products-value-monthly"),
    fetchJSON<ExportTotalResp>("/dashboard/export/total"),
    fetchJSON<ExchangeTimelineResp>("/dashboard/exchange/timeline"),
    fetchJSON<CoalResponse>("/dashboard/coal-cny/latest"),
  ]);

  const out: DashboardData = { ...empty };

  // ---- metrics ----
  if (metricsR.status === "fulfilled" && Array.isArray(metricsR.value)) {
    out.metrics = metricsR.value;
  }

  // ---- AverageTicketsCreated ----
  if (productsTimelineR.status === "fulfilled") {
    const json = productsTimelineR.value;
    const monthly = json.monthly ?? [];
    const productCodes =
      json.products?.map((p) => p.code) ?? ["2601", "2603", "2701", "2709"];

    const metrics: TicketMetric[] = [];

    for (const row of monthly) {
      const period =
        row.period ??
        (row.year != null && row.month != null
          ? `${row.year}-${String(row.month).padStart(2, "0")}`
          : "");

      if (!period) continue;
      const date = `${period}-01`;

      for (const code of productCodes) {
        const raw = (row as any)[code];
        const num = Number(raw);
        if (!Number.isFinite(num)) continue;

        metrics.push({ date, type: code, count: Math.round(num) });
      }
    }

    out.productsMonthly = metrics;
  }

  // ---- TicketByChannels ----
  if (productsValueMonthlyR.status === "fulfilled") {
    const v: any = productsValueMonthlyR.value;

    if (Array.isArray(v)) {
      out.productsValuePie = v;
    } else {
      const products = v.products ?? [];
      const rows = v.monthly ?? [];
      const lastRow = rows.length ? rows[rows.length - 1] : null;

      out.productsValueYearLabel =
        v.yearLabel ?? String(lastRow?.year ?? lastRow?.period ?? "") ?? "";

      if (Array.isArray(v.data)) {
        out.productsValuePie = v.data;
      } else if (products.length && lastRow) {
        const items: ProductsValuePieRow[] = [];
        for (const p of products) {
          const num = Number((lastRow as any)[p.code]);
          if (!Number.isFinite(num)) continue;
          items.push({ name: p.name, value: num });
        }
        out.productsValuePie = items;
      }
    }
  }

  // ---- export total ----
  if (exportTotalR.status === "fulfilled") {
    const v = exportTotalR.value.export_this_year;
    out.productsValueExportTotal = typeof v === "number" ? v : null;
  }

  // ---- Conversions (share by common-ton base) ----
  if (exchangeTimelineR.status === "fulfilled") {
    const commodities = exchangeTimelineR.value.commodities ?? [];

    // base tons array (scale-г нэг мөр болгоно)
    const bases = commodities.map((c) => {
      const scaled = Number.isFinite(c.total_scaled) ? c.total_scaled : 0;
      const unit = c.unit_scaled || "тн";
      return toTons(scaled, unit);
    });

    const totalBase = bases.reduce((a, b) => a + b, 0);

    const items: Conversion[] = commodities.map((c, i) => {
      const baseTon = bases[i] ?? 0;
      const share = totalBase > 0 ? baseTon / totalBase : 0; // 0..1

      return {
        key: c.key,
        name: c.name,
        value: Number.isFinite(c.total_scaled) ? c.total_scaled : 0,
        unit: c.unit_scaled || "тн",

        // chart.tsx bubble sizing-д хэрэглэнэ
        size: share,
        share,

        // chart.tsx tooltip-д ашиглах “displayValue/Unit”
        displayValue: Number.isFinite(c.total_scaled) ? c.total_scaled : 0,
        displayUnit: c.unit_scaled || "тн",
      } as any;
    });

    out.exchangeTimeline = items;
  }

  // ---- Coal latest ----
  if (coalLatestR.status === "fulfilled") {
    out.coalLatest = coalLatestR.value;
  }

  return out;
}