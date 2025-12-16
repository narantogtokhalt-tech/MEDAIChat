// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\average-tickets-created\chart.tsx
"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { VChart } from "@visactor/react-vchart";
import type { IBarChartSpec } from "@visactor/vchart";
import { ticketChartDataAtom } from "@/lib/atoms";
import type { TicketMetric } from "@/types/types";

const COLOR_BY_TYPE: Record<string, string> = {
  "2601": "#4C7EF3",
  "2603": "#60C2FB",
  "2701": "#3161F8",
  "2709": "#F49C24",
};

function buildSpec(values: TicketMetric[]): IBarChartSpec {
  return {
    type: "bar",
    background: "transparent",
    padding: [10, 0, 10, 0],

    data: [{ id: "barData", values }],

    xField: "date",
    yField: "count",
    seriesField: "type",
    stack: false,

    legends: { visible: false },

    tooltip: {
      trigger: ["hover", "click"],
      ...( {
        dimension: { visible: false },
        crosshair: { visible: false },
      } as any),
    },

    bar: {
      state: { hover: { outerBorder: { distance: 0, lineWidth: 0 } } },
      style: {
        cornerRadius: [10, 10, 0, 0],
        fill: (d: any) => COLOR_BY_TYPE[String(d.type)] ?? "#999999",
      },
    },
  };
}

export default function Chart() {
  const ticketChartData = useAtomValue(ticketChartDataAtom);
  const spec = useMemo(
    () => buildSpec(Array.isArray(ticketChartData) ? ticketChartData : []),
    [ticketChartData],
  );

  return (
    <div className="h-full w-full bg-transparent [&_canvas]:bg-transparent [&_svg]:bg-transparent">
      <VChart spec={spec} />
    </div>
  );
}