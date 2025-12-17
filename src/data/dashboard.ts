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

  // optional debug
  __debug?: any;
};

const BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE || "";

// ✅ Render дээр удаан гарах тул 30 сек болгоё
const FETCH_TIMEOUT_MS = 30_000;

function join(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === "AbortError";
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

async function fetchJSON<T>(path: string, opts?: { timeoutMs?: number; cache?: RequestCache }): Promise<T> {
  const url = join(BASE, path);
  const timeoutMs = opts?.timeoutMs ?? FETCH_TIMEOUT_MS;

  // ✅ Aggregated endpoint дээр caching-ийг route.ts дээрээ удирдана
  const init: RequestInit = {
    method: "GET",
    cache: opts?.cache ?? "no-store",
  };

  try {
    const res = await fetchWithTimeout(url, init, timeoutMs);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Fetch failed ${res.status} ${url} :: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    // abort бол илүү ойлгомжтой алдаа
    if (isAbortError(err)) {
      throw new Error(`Fetch timeout/aborted: ${url}`);
    }
    throw err;
  }
}

// ---- Backend aggregated response (local) ----
type DashboardAllResp = {
  base?: string;
  data?: {
    metrics?: Metric[]; // backend дээр metrics байвал ашиглана, байхгүй бол getMetrics() fallback
    productsTimeline?: any; // { products, monthly }
    productsValueMonthly?: any; // { products, monthly, yearLabel, exportTotal, data? }
    exportTotal?: any; // { export_this_year, ... }
    exchangeTimeline?: any; // { commodities: [...] }
    coalLatest?: CoalResponse;
  };
  probes?: any; // debug=1 үед
};

type ProductsTimelineResp = {
  products?: Array<{ code: string; name?: string; unit?: string }>;
  monthly?: Array<{
    year?: number;
    month?: number;
    period?: string;
    [code: string]: any;
  }>;
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

type ExportTotalResp = {
  export_this_year: number | null;
};

type ExchangeTimelineResp = {
  commodities?: Array<{
    key: string;
    name: string;
    total_ton: number;
    total_scaled: number;
    unit_scaled: string;
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
      (row.year != null && row.month != null ? `${row.year}-${String(row.month).padStart(2, "0")}` : "");

    if (!period) continue;
    const date = `${period}-01`;

    for (const code of productCodes) {
      const raw = (row as any)[code];
      const num = Number(raw);
      if (!Number.isFinite(num)) continue;
      metrics.push({ date, type: code, count: Math.round(num) });
    }
  }

  return metrics;
}

function buildProductsValuePie(v: ProductsValueMonthlyResp): { pie: ProductsValuePieRow[]; yearLabel: string } {
  if (Array.isArray(v)) return { pie: v, yearLabel: "" };

  const products = v.products ?? [];
  const rows = v.monthly ?? [];
  const lastRow = rows.length ? rows[rows.length - 1] : null;

  const yearLabel = v.yearLabel ?? String(lastRow?.year ?? lastRow?.period ?? "") ?? "";

  if (Array.isArray(v.data)) return { pie: v.data, yearLabel };

  if (products.length && lastRow) {
    const items: ProductsValuePieRow[] = [];
    for (const p of products) {
      const num = Number((lastRow as any)[p.code]);
      if (!Number.isFinite(num)) continue;
      items.push({ name: p.name, value: num });
    }
    return { pie: items, yearLabel };
  }

  return { pie: [], yearLabel };
}

function buildExchangeTimeline(resp: ExchangeTimelineResp): Conversion[] {
  const commodities = resp.commodities ?? [];
  const bases = commodities.map((c) => toTons(Number.isFinite(c.total_scaled) ? c.total_scaled : 0, c.unit_scaled || "тн"));
  const totalBase = bases.reduce((a, b) => a + b, 0);

  return commodities.map((c, i) => {
    const baseTon = bases[i] ?? 0;
    const share = totalBase > 0 ? baseTon / totalBase : 0;

    return {
      key: c.key,
      name: c.name,
      value: Number.isFinite(c.total_scaled) ? c.total_scaled : 0,
      unit: c.unit_scaled || "тн",
      size: share,
      share,
      displayValue: Number.isFinite(c.total_scaled) ? c.total_scaled : 0,
      displayUnit: c.unit_scaled || "тн",
    } as any;
  });
}

export async function getDashboardData(opts?: { debug?: boolean }): Promise<DashboardData> {
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

  // ✅ НЭГ endpoint
  const debug = opts?.debug ? 1 : 0;
  const all = await fetchJSON<DashboardAllResp>(
  `/dashboard/all?debug=${debug}`,
  { cache: debug ? "no-store" : "force-cache" }
);

  const data = all.data ?? {};
  const out: DashboardData = { ...empty };

  // metrics: backend дээр өгч байвал түүнийг авна, үгүй бол хуучнаараа getMetrics()
  if (Array.isArray(data.metrics)) {
    out.metrics = data.metrics;
  } else {
    try {
      const m = await getMetrics();
      out.metrics = Array.isArray(m) ? m : null;
    } catch {
      out.metrics = null;
    }
  }

  // products timeline -> productsMonthly
  if (data.productsTimeline) {
    out.productsMonthly = buildProductsMonthly(data.productsTimeline as ProductsTimelineResp);
  }

  // pie + yearlabel
  if (data.productsValueMonthly) {
    const { pie, yearLabel } = buildProductsValuePie(data.productsValueMonthly as ProductsValueMonthlyResp);
    out.productsValuePie = pie;
    out.productsValueYearLabel = yearLabel;
  }

  // export total
  if (data.exportTotal) {
    const v = (data.exportTotal as ExportTotalResp).export_this_year;
    out.productsValueExportTotal = typeof v === "number" ? v : null;
  }

  // exchange timeline
  if (data.exchangeTimeline) {
    out.exchangeTimeline = buildExchangeTimeline(data.exchangeTimeline as ExchangeTimelineResp);
  }

  // coal latest
  if (data.coalLatest) {
    out.coalLatest = data.coalLatest as CoalResponse;
  }

  // debug passthrough (хүсвэл)
  if (debug) out.__debug = all.probes ?? all;

  return out;
}