// src/app/(dashboard)/page.tsx

import { Suspense } from "react";
import { headers } from "next/headers";

import ChatbotWidget from "@/components/ChatbotWidget";
import { Metrics } from "@/components/chart-blocks";
import type { DashboardData } from "@/data/dashboard";
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

/**
 * ✅ Next.js 16: headers() нь async → await заавал
 * ✅ Absolute URL ашиглана
 * ✅ Promise share хэвээр
 */
async function getDashboardPromise(): Promise<DashboardData> {
  const h = await headers();

  const host = h.get("host"); // localhost:3000
  const proto = h.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Missing host header; cannot build absolute URL");
  }

  const url = `${proto}://${host}/api/dashboard`;

  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as DashboardData;
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
  // ✅ promise share — 1 л удаа
  const dashboardPromise = getDashboardPromise();

  return (
    <>
      <div>
        <Suspense fallback={<SectionSkeleton title="Loading metrics..." />}>
          <MetricsBlock p={dashboardPromise} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Loading dashboard charts..." />}>
          <ChartsBlock p={dashboardPromise} />
        </Suspense>
      </div>

      <ChatbotWidget />
    </>
  );
}