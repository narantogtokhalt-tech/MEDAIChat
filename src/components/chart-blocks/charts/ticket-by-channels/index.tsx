import { Rss } from "lucide-react";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";
import type { ProductsValuePieRow } from "@/data/dashboard";

type Props = {
  pieData: ProductsValuePieRow[];
  yearLabel: string;
  exportTotal: number | null;
};

export default function TicketByChannels({ pieData, yearLabel, exportTotal }: Props) {
  const hasData = Array.isArray(pieData) && pieData.length > 0;

  return (
    <section className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <ChartTitle title="Экспорт бүтээгдэхүүнээр (үнийн дүн, мян.$)" icon={Rss} />

        {/* Optional жижиг label */}
        {yearLabel ? (
          <div className="text-xs text-muted-foreground">{yearLabel}</div>
        ) : null}
      </div>

      <div className="relative flex min-h-64 flex-grow flex-col justify-center">
        {!hasData ? (
          <div className="text-sm text-muted-foreground">Өгөгдөл алга.</div>
        ) : (
          <Chart pieData={pieData} yearLabel={yearLabel} exportTotal={exportTotal} />
        )}
      </div>
    </section>
  );
}