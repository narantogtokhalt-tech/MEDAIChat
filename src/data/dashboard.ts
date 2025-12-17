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

const BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || "";

// ---- perf knobs ----
const IS_PROD = process.env.NODE_ENV === "production";
const FETCH_TIMEOUT_MS = IS_PROD ? 12_000 : 15_000; // backend удаан байгааг бодоод 12s
const FETCH_RETRY = IS_PROD ? 0 : 1;

function join(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === "AbortError";
}

// ✅ "14,671.7" / "3 544.81" -> 14671.7 / 3544.81
function toNum(v: any): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const s0 = v.trim();
    if (!s0) return null;
    const s = s0.replace(/\s+/g, "").replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/**
 * ✅ IMPORTANT:
 * External API (stats-chatbot) руу хийх fetch дээр Next-ийн force-cache/next.revalidate ашиглахгүй.
 * Cache/ISR-г зөвхөн /api/dashboard route дээр нэг л давхарга болгон шийдсэн.
 */
async function fetchJSON<T>(
  path: string,
  opts?: { timeoutMs?: number; retry?: number }
): Promise<T> {
  const url = join(BASE, path);

  const timeoutMs = opts?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const retry = opts?.retry ?? FETCH_RETRY;

  const init: RequestInit = {
    method: "GET",
    cache: "no-store",
  };

  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Fetch failed ${res.status} ${url} :: ${text.slice(0, 200)}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      const shouldRetry = attempt < retry && (isAbortError(err) || err instanceof TypeError);
      if (!shouldRetry) break;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(`Fetch failed ${url}`);
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
  export_this_year: number | string | null;
  export_prev_same_day: number | string | null;
  yoy_pct: number | string | null;
};

type ProductsValueMonthlyResp =
  | ProductsValuePieRow[]
  | {
      products?: Array<{ code: string; name: string; unit?: string }>;
      monthly?: Array<{ year?: number; period?: string; [code: string]: any }>;
      yearLabel?: string;
      exportTotal?: number | string;
      data?: ProductsValuePieRow[];
    };

type ExchangeTimelineResp = {
  from?: string;
  to?: string;
  commodities?: Array<{
    key: string;
    name: string;
    total_ton: number | string;
    total_scaled: number | string;
    unit_scaled: string; // "сая тн" / "мян. тн" гэх мэт
  }>;
};

function toTons(totalScaled: number, unitScaled: string) {
  const u = (unitScaled || "").toLowerCase();
  if (u.includes("сая")) return totalScaled * 1_000_000;
  if (u.includes("мян")) return totalScaled * 1_000;
  return totalScaled;
}

function buildProductsMonthly(json: ProductsTimelineResp): TicketMetric[] {
  const monthly = json.monthly ?? [];
  const productCodes = json.products?.map((p) => p.code) ?? ["2601", "2603", "2701", "2709"];

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
      const num = toNum((row as any)[code]);
      if (num == null) continue;

      metrics.push({ date, type: code, count: Math.round(num) });
    }
  }

  return metrics;
}

function buildProductsValuePie(v: ProductsValueMonthlyResp): {
  pie: ProductsValuePieRow[];
  yearLabel: string;
} {
  if (Array.isArray(v)) {
    return { pie: v, yearLabel: "" };
  }

  const products = v.products ?? [];
  const rows = v.monthly ?? [];
  const lastRow = rows.length ? rows[rows.length - 1] : null;

  const yearLabel = v.yearLabel ?? String(lastRow?.year ?? lastRow?.period ?? "") ?? "";

  if (Array.isArray(v.data)) {
    return { pie: v.data, yearLabel };
  }

  if (products.length && lastRow) {
    const items: ProductsValuePieRow[] = [];
    for (const p of products) {
      const num = toNum((lastRow as any)[p.code]);
      if (num == null) continue;
      items.push({ name: p.name, value: num });
    }
    return { pie: items, yearLabel };
  }

  return { pie: [], yearLabel };
}

function buildExchangeTimeline(resp: ExchangeTimelineResp): Conversion[] {
  const commodities = resp.commodities ?? [];

  const bases = commodities.map((c) => {
    const scaled = toNum(c.total_scaled) ?? 0;
    const unit = c.unit_scaled || "тн";
    return toTons(scaled, unit);
  });

  const totalBase = bases.reduce((a, b) => a + b, 0);

  return commodities.map((c, i) => {
    const scaled = toNum(c.total_scaled) ?? 0;
    const unit = c.unit_scaled || "тн";

    const baseTon = bases[i] ?? 0;
    const share = totalBase > 0 ? baseTon / totalBase : 0;

    return {
      key: c.key,
      name: c.name,
      value: scaled,
      unit,
      size: share,
      share,
      displayValue: scaled,
      displayUnit: unit,
    } as any;
  });
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

  if (metricsR.status === "fulfilled" && Array.isArray(metricsR.value)) {
    out.metrics = metricsR.value;
  }

  if (productsTimelineR.status === "fulfilled") {
    out.productsMonthly = buildProductsMonthly(productsTimelineR.value);
  }

  if (productsValueMonthlyR.status === "fulfilled") {
    const { pie, yearLabel } = buildProductsValuePie(productsValueMonthlyR.value);
    out.productsValuePie = pie;
    out.productsValueYearLabel = yearLabel;
  }

  if (exportTotalR.status === "fulfilled") {
    out.productsValueExportTotal = toNum(exportTotalR.value.export_this_year);
  }

  if (exchangeTimelineR.status === "fulfilled") {
    out.exchangeTimeline = buildExchangeTimeline(exchangeTimelineR.value);
  }

  if (coalLatestR.status === "fulfilled") {
    out.coalLatest = coalLatestR.value;
  }

  return out;
}