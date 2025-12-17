// src/app/(dashboard)/page.tsx

import { Suspense } from "react";

import ChatbotWidget from "@/components/ChatbotWidget";
import { Metrics } from "@/components/chart-blocks";
import { getDashboardData, type DashboardData } from "@/data/dashboard";
import DashboardChartsClient from "./charts.client";

export const revalidate = 60;

function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="h-56 w-full animate-pulse rounded bg-muted" />
      <div className="mt-2 text-xs text-muted-foreground">{title}</div>
    </div>
  );
}

function SectionError({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground break-words">{message}</div>
    </div>
  );
}

/**
 * ✅ API route руу absolute URL-ээр буцааж fetch хийхгүй
 * ✅ Server-side дээрээс шууд getDashboardData() дуудна (найдвартай)
 * ✅ Promise share хэвээр (1 л удаа fetch)
 */
async function getDashboardPromise(): Promise<DashboardData> {
  // debug-г эндээс асаах шаардлагагүй. /api/dashboard?debug=1-г зөвхөн шалгалтад ашиглана.
  return await getDashboardData({ debug: false });
}

async function MetricsBlock({ p }: { p: Promise<DashboardData> }) {
  const dashboard = await p;
  return <Metrics metrics={dashboard.metrics} />;
}

async function ChartsBlock({ p }: { p: Promise<DashboardData> }) {
  const dashboard = await p;

  return (
    <DashboardChartsClient
      productsMonthly={dashboard.productsMonthly}
      exchangeTimeline={dashboard.exchangeTimeline}
      productsValuePie={dashboard.productsValuePie}
      productsValueYearLabel={dashboard.productsValueYearLabel}
      productsValueExportTotal={dashboard.productsValueExportTotal}
      coalLatest={dashboard.coalLatest}
    />
  );
}

export default function Home() {
  const dashboardPromise = getDashboardPromise();

  return (
    <>
      <div className="space-y-4">
        <Suspense fallback={<SectionSkeleton title="Loading metrics..." />}>
          {/* metrics */}
          <MetricsSafe p={dashboardPromise} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Loading dashboard charts..." />}>
          {/* charts */}
          <ChartsSafe p={dashboardPromise} />
        </Suspense>
      </div>

      <ChatbotWidget />
    </>
  );
}

/** ---- Error-safe wrappers (page цагаан болохоос хамгаална) ---- */

async function MetricsSafe({ p }: { p: Promise<DashboardData> }) {
  try {
    return await MetricsBlock({ p });
  } catch (e: any) {
    return <SectionError title="Metrics failed" message={e?.message ?? String(e)} />;
  }
}

async function ChartsSafe({ p }: { p: Promise<DashboardData> }) {
  try {
    return await ChartsBlock({ p });
  } catch (e: any) {
    return <SectionError title="Charts failed" message={e?.message ?? String(e)} />;
  }
}