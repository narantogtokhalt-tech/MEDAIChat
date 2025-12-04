// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\average-tickets-created\index.tsx
"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { FilePlus2 } from "lucide-react";
import {
  rawTicketDataAtom,
  ticketChartDataAtom,
  dateRangeAtom,
} from "@/lib/atoms";
import type { TicketMetric } from "@/types/types";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";
import { DatePickerWithRange } from "./components/date-range-picker";
import MetricCard from "./components/metric-card";

const avgValue = (data: TicketMetric[], type: string) => {
  const filtered = data.filter((d) => d.type === type);
  if (filtered.length === 0) return 0;
  return Math.round(
    filtered.reduce((acc, x) => acc + x.count, 0) / filtered.length,
  );
};

export default function AverageTicketsCreated() {
  const setRawData = useSetAtom(rawTicketDataAtom);
  const setDateRange = useSetAtom(dateRangeAtom);
  const ticketChartData = useAtomValue(ticketChartDataAtom);

  // Backend-с monthly export products timeline ачаална
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/export/products-monthly");
        const data: TicketMetric[] = await res.json();

        // 1) Бүх timeline-ийг rawTicketDataAtom-д хадгална
        setRawData(data);

        // 2) Default date range → энэ он
        if (data.length > 0) {
          const currentYear = new Date().getFullYear();
          const datesThisYear = data
            .map((d) => new Date(d.date))
            .filter((d) => d.getFullYear() === currentYear);

          const targetDates = datesThisYear.length > 0
            ? datesThisYear
            : data.map((d) => new Date(d.date)); // хэрэв энэ оных байхгүй бол бүх жил

          if (targetDates.length > 0) {
            const min = new Date(
              Math.min(...targetDates.map((d) => d.getTime())),
            );
            const max = new Date(
              Math.max(...targetDates.map((d) => d.getTime())),
            );

            setDateRange({
              from: min,
              to: max,
            });
          }
        }
      } catch (e) {
        console.error("Failed to load export products timeline", e);
      }
    }

    load();
  }, [setRawData, setDateRange]);

  // 4 бүтээгдэхүүн тус бүрийн дундаж (шүүлттэй датаас)
  const avg2601 = avgValue(ticketChartData, "2601");
  const avg2603 = avgValue(ticketChartData, "2603");
  const avg2701 = avgValue(ticketChartData, "2701");
  const avg2709 = avgValue(ticketChartData, "2709");

  return (
    <section className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ChartTitle title="Экспорт бүтээгдэхүүнээр (сараар)" icon={FilePlus2} />
        <DatePickerWithRange />
      </div>

      <div className="flex flex-wrap">
        <div className="my-4 flex w-72 shrink-0 flex-col gap-6">
          <MetricCard
            title="2601 - Төмрийн хүдэр, баяжмал"
            value={avg2601}
            color="#4C7EF3"
          />
          <MetricCard
            title="2603 - Зэсийн баяжмал"
            value={avg2603}
            color="#60C2FB"
          />
          <MetricCard
            title="2701 - Нүүрс"
            value={avg2701}
            color="#3161F8"
          />
          <MetricCard
            title="2709 - Газрын тос"
            value={avg2709}
            color="#F49C24"
          />
        </div>

        <div className="relative h-96 min-w-[320px] flex-1">
          <Chart />
        </div>
      </div>
    </section>
  );
}