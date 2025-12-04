// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\average-tickets-created\chart.tsx
"use client";

import { useAtomValue } from "jotai";
import { VChart } from "@visactor/react-vchart";
import type { IBarChartSpec } from "@visactor/vchart";
import { ticketChartDataAtom } from "@/lib/atoms";
import type { TicketMetric } from "@/types/types";

// MetricCard-уудынхаа өнгөтэй тааруулж байна
const COLOR_BY_TYPE: Record<string, string> = {
  "2601": "#4C7EF3", // Төмрийн хүдэр, баяжмал
  "2603": "#60C2FB", // Зэсийн баяжмал
  "2701": "#3161F8", // Нүүрс
  "2709": "#F49C24", // Газрын тос
};

const generateSpec = (data: TicketMetric[]): IBarChartSpec => ({
  type: "bar",
  data: [
    {
      id: "barData",
      values: data,
    },
  ],
  xField: "date",
  yField: "count",
  seriesField: "type",
  padding: [10, 0, 10, 0],
  legends: {
    visible: true, // Хэрэв legend харуулахгүй бол false болгож болно
  },
  stack: false,
  tooltip: {
    trigger: ["click", "hover"],
  },
  bar: {
    state: {
      hover: {
        outerBorder: {
          distance: 2,
          lineWidth: 2,
        },
      },
    },
    style: {
      cornerRadius: [12, 12, 12, 12],
      // type-ээр нь өнгө сонгоно
      fill: (datum: any) => {
        const key = String(datum.type);
        return COLOR_BY_TYPE[key] ?? "#999999";
      },
      // хүсвэл давхардсан баруудын давхаргын дараалал:
      zIndex: (datum: any) => {
        const order = ["2601", "2603", "2701", "2709"];
        const idx = order.indexOf(String(datum.type));
        return idx === -1 ? 1 : idx + 1;
      },
    },
  },
});

export default function Chart() {
  const ticketChartData = useAtomValue(ticketChartDataAtom);
  const spec = generateSpec(ticketChartData);
  return <VChart spec={spec} />;
}