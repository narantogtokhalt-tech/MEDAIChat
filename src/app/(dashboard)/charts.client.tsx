"use client";

import React from "react";
import dynamic from "next/dynamic";
import Container from "@/components/container";

// local skeleton
function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="h-56 w-full animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-2 text-xs text-muted-foreground">{title}</div>
    </div>
  );
}

/** ✅ Chart унах үед бүх page blank болохоос хамгаална */
class ChartErrorBoundary extends React.Component<
  { title: string; children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { hasError: true, message: msg };
  }

  componentDidCatch(err: unknown) {
    // хэрэгтэй бол энд log хийж болно
    // console.error("[ChartErrorBoundary]", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ChartSkeleton
          title={`${this.props.title} (chart crashed: ${this.state.message})`}
        />
      );
    }
    return this.props.children;
  }
}

// ✅ ssr:false зөвхөн client component дотор OK
const AverageTicketsCreated = dynamic(
  () => import("@/components/chart-blocks/client").then((m) => m.AverageTicketsCreated),
  { ssr: false, loading: () => <ChartSkeleton title="Loading AverageTicketsCreated..." /> }
);

const Conversions = dynamic(
  () => import("@/components/chart-blocks/client").then((m) => m.Conversions),
  { ssr: false, loading: () => <ChartSkeleton title="Loading Conversions..." /> }
);

const TicketByChannels = dynamic(
  () => import("@/components/chart-blocks/client").then((m) => m.TicketByChannels),
  { ssr: false, loading: () => <ChartSkeleton title="Loading TicketByChannels..." /> }
);

const CustomerSatisfication = dynamic(
  () => import("@/components/chart-blocks/client").then((m) => m.CustomerSatisfication),
  { ssr: false, loading: () => <ChartSkeleton title="Loading CustomerSatisfication..." /> }
);

type Props = {
  productsMonthly: any[]; // TicketMetric[]
  exchangeTimeline: any[] | null; // Conversion[] | null
  productsValuePie: any[]; // ProductsValuePieRow[]
  productsValueYearLabel: string;
  productsValueExportTotal: number | null;
  coalLatest: any | null; // CoalResponse | null
};

export default function DashboardChartsClient(props: Props) {
  // ✅ safety: null/undefined-ийг chart-д бүү өг
  const productsMonthly = Array.isArray(props.productsMonthly) ? props.productsMonthly : [];
  const exchangeTimeline = Array.isArray(props.exchangeTimeline) ? props.exchangeTimeline : [];
  const productsValuePie = Array.isArray(props.productsValuePie) ? props.productsValuePie : [];
  const yearLabel = props.productsValueYearLabel ?? "";
  const exportTotal = typeof props.productsValueExportTotal === "number" ? props.productsValueExportTotal : null;
  const coalLatest = props.coalLatest ?? null;

  return (
    <>
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-3 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-2">
          <ChartErrorBoundary title="AverageTicketsCreated">
            <AverageTicketsCreated data={productsMonthly} />
          </ChartErrorBoundary>
        </Container>

        <Container className="py-4 laptop:col-span-1">
          <ChartErrorBoundary title="Conversions">
            <Conversions data={exchangeTimeline} />
          </ChartErrorBoundary>
        </Container>
      </div>

      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <ChartErrorBoundary title="TicketByChannels">
            <TicketByChannels pieData={productsValuePie} yearLabel={yearLabel} exportTotal={exportTotal} />
          </ChartErrorBoundary>
        </Container>

        <Container className="py-4 laptop:col-span-1">
          <ChartErrorBoundary title="CustomerSatisfication">
            <CustomerSatisfication data={coalLatest} />
          </ChartErrorBoundary>
        </Container>
      </div>
    </>
  );
}