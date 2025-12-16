"use client";

import { useEffect, useMemo, useRef } from "react";
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
import SummaryCard, { type SummaryCardItem } from "./card";

type Props = {
  /** Server-side getDashboardData() дээрээс ирэх бэлэн timeline metric */
  data: TicketMetric[];
};

const COLOR_BY_TYPE: Record<string, string> = {
  "2601": "#4C7EF3",
  "2603": "#60C2FB",
  "2701": "#3161F8",
  "2709": "#F49C24",
};

const NAME_BY_TYPE: Record<string, string> = {
  "2601": "Төмрийн хүдэр, баяжмал",
  "2603": "Зэсийн баяжмал",
  "2701": "Нүүрс",
  "2709": "Газрын тос",
};

const TYPES = ["2601", "2603", "2701", "2709"] as const;

function sumByType(data: TicketMetric[], type: string): number {
  return data
    .filter((d) => String(d.type) === type)
    .reduce((acc, x) => acc + (Number.isFinite(x.count) ? x.count : 0), 0);
}

/** Сонгосон dateRange (filter хийсэн ticketChartData) доторх хамгийн сүүлийн сарын утга */
function getLastValue(data: TicketMetric[], type: string): number {
  const rows = data.filter((d) => String(d.type) === type);
  if (!rows.length) return 0;

  rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const v = Number(rows[rows.length - 1]?.count ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatRange(from?: Date, to?: Date) {
  if (!from || !to) return "—";
  const f = `${from.getFullYear()}-${pad2(from.getMonth() + 1)}-${pad2(from.getDate())}`;
  const t = `${to.getFullYear()}-${pad2(to.getMonth() + 1)}-${pad2(to.getDate())}`;
  return `${f} – ${t}`;
}

function inferYearMode(from?: Date, to?: Date) {
  if (!from || !to) return { isYearMode: false, year: null as number | null };

  const sameYear = from.getFullYear() === to.getFullYear();
  const looksLikeFullYear = from.getMonth() === 0 && to.getMonth() === 11;

  if (sameYear && looksLikeFullYear) {
    return { isYearMode: true, year: from.getFullYear() };
  }
  return { isYearMode: false, year: null as number | null };
}

export default function AverageTicketsCreated({ data }: Props) {
  const setRawData = useSetAtom(rawTicketDataAtom);
  const setDateRange = useSetAtom(dateRangeAtom);

  // dateRange-тэй уялдсан, шүүлттэй дата (atoms)
  const ticketChartData = useAtomValue(ticketChartDataAtom);
  const selectedRange = useAtomValue(dateRangeAtom);

  // dateRange-г 1 удаа initialize
  const didInitRange = useRef(false);

  useEffect(() => {
    const metrics = Array.isArray(data) ? data : [];
    setRawData(metrics);

    if (!didInitRange.current && metrics.length > 0) {
      const currentYear = new Date().getFullYear();

      const datesThisYear = metrics
        .map((d) => new Date(d.date))
        .filter((d) => d.getFullYear() === currentYear);

      const targetDates =
        datesThisYear.length > 0 ? datesThisYear : metrics.map((d) => new Date(d.date));

      if (targetDates.length > 0) {
        const max = new Date(Math.max(...targetDates.map((d) => d.getTime())));

        // ✅ Jan 01 –ийг хүчээр тавина (data Feb-с эхэлсэн ч UI дээр Jan 01 гэж харагдана)
        const y = max.getFullYear();
        const jan01 = new Date(y, 0, 1);

        setDateRange({ from: jan01, to: max });
        didInitRange.current = true;
      }
    }
  }, [data, setRawData, setDateRange]);

  // ✅ Card header text: “2025 • Энэ жилийн өссөн дүн” эсвэл “Сонгосон хугацааны өссөн дүн”
  const { isYearMode, year } = useMemo(
    () => inferYearMode(selectedRange?.from, selectedRange?.to),
    [selectedRange?.from, selectedRange?.to],
  );

  const cardTitle = isYearMode && year ? `${year}` : null;
  const cardSubtitle = isYearMode ? "Энэ жилийн өссөн дүн" : "Сонгосон хугацааны өссөн дүн";

  const cardRangeText = useMemo(
    () => formatRange(selectedRange?.from, selectedRange?.to),
    [selectedRange?.from, selectedRange?.to],
  );

  // ✅ Card data: сонгосон range дээрх нийлбэр + хамгийн сүүлийн сар
  const cardItems = useMemo(() => {
    const safe = Array.isArray(ticketChartData) ? ticketChartData : [];

    const items: SummaryCardItem[] = TYPES.map((t) => {
      const total = sumByType(safe, t);
      const last = getLastValue(safe, t);

      return {
        type: t,
        name: NAME_BY_TYPE[t],
        color: COLOR_BY_TYPE[t],
        total,
        last,
      };
    });

    // нүүрсийг дээр гаргах (visual priority)
    items.sort((a, b) => (a.type === "2701" ? -1 : 0) - (b.type === "2701" ? -1 : 0));
    return items;
  }, [ticketChartData]);

  return (
    <section className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ChartTitle title="Экспорт бүтээгдэхүүнээр (сараар)" icon={FilePlus2} />
        <DatePickerWithRange />
      </div>

      <div className="flex flex-wrap gap-6">
        {/* ✅ Зүүн талын шилэн summary card */}
        <div className="my-4 w-72 shrink-0">
          <SummaryCard
            titleYear={cardTitle}
            subtitle={cardSubtitle}
            rangeText={cardRangeText}
            items={cardItems}
          />
        </div>

        {/* Chart */}
        <div className="relative h-96 min-w-[320px] flex-1">
          <Chart />
        </div>
      </div>
    </section>
  );
}