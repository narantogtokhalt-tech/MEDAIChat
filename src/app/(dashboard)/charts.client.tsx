"use client";

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

// ✅ ssr:false зөвхөн client component дотор OK
const AverageTicketsCreated = dynamic(
  () =>
    import("@/components/chart-blocks/client").then(
      (m) => m.AverageTicketsCreated
    ),
  { ssr: false, loading: () => <ChartSkeleton title="Loading chart..." /> }
);

const Conversions = dynamic(
  () => import("@/components/chart-blocks/client").then((m) => m.Conversions),
  { ssr: false, loading: () => <ChartSkeleton title="Loading chart..." /> }
);

const TicketByChannels = dynamic(
  () =>
    import("@/components/chart-blocks/client").then((m) => m.TicketByChannels),
  { ssr: false, loading: () => <ChartSkeleton title="Loading chart..." /> }
);

const CustomerSatisfication = dynamic(
  () =>
    import("@/components/chart-blocks/client").then(
      (m) => m.CustomerSatisfication
    ),
  { ssr: false, loading: () => <ChartSkeleton title="Loading chart..." /> }
);

type Props = {
  productsMonthly: any[];
  exchangeTimeline: any[] | null;
  productsValuePie: any[];
  productsValueYearLabel: string;
  productsValueExportTotal: number | null;
  coalLatest: any | null;
};

export default function DashboardChartsClient(props: Props) {
  return (
    <>
      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-3 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-2">
          <AverageTicketsCreated data={props.productsMonthly} />
        </Container>

        <Container className="py-4 laptop:col-span-1">
          <Conversions data={props.exchangeTimeline} />
        </Container>
      </div>

      <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
        <Container className="py-4 laptop:col-span-1">
          <TicketByChannels
            pieData={props.productsValuePie}
            yearLabel={props.productsValueYearLabel}
            exportTotal={props.productsValueExportTotal}
          />
        </Container>

        <Container className="py-4 laptop:col-span-1">
          <CustomerSatisfication data={props.coalLatest} />
        </Container>
      </div>
    </>
  );
}