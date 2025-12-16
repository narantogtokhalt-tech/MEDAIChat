// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\ticket-by-channels\chart.tsx
"use client";

import { useMemo } from "react";
import { type IPieChartSpec, VChart } from "@visactor/react-vchart";
import type { Datum } from "@visactor/vchart/esm/typings";
import { ticketByChannels } from "@/data/ticket-by-channels"; // fallback
import { addThousandsSeparator } from "@/lib/utils";
import type { ProductsValuePieRow } from "@/data/dashboard";

type Props = {
  pieData: ProductsValuePieRow[];
  yearLabel: string;
  exportTotal: number | null;
};

const MILLION = 1;

type PieDataItem = {
  type: string;
  value: number;
};

// ✅ Chart + custom legend ижил өнгө ашиглахын тулд palette тогтооно
const PALETTE = [
  "#22c55e", // green
  "#38bdf8", // light blue
  "#f59e0b", // orange
  "#3b82f6", // blue
  "#a78bfa", // purple
  "#94a3b8", // gray
];

export default function Chart({ pieData, yearLabel, exportTotal }: Props) {
  const effectiveData: PieDataItem[] = useMemo(() => {
    const fromProps =
      Array.isArray(pieData) && pieData.length
        ? pieData
            .map((x) => ({
              type: x.name,
              value: Number(x.value) / MILLION,
            }))
            .filter((x) => Number.isFinite(x.value))
        : [];

    if (fromProps.length) return fromProps;

    return ticketByChannels.map((x) => ({
      type: x.type,
      value: x.value,
    }));
  }, [pieData]);

  const centerValue = useMemo(() => {
    if (typeof exportTotal === "number" && Number.isFinite(exportTotal)) {
      return exportTotal / MILLION;
    }
    return effectiveData.reduce((acc, c) => acc + (c.value || 0), 0);
  }, [exportTotal, effectiveData]);

  // ✅ custom legend-д өнгө оноох (chart-ын palette-тай таарна)
  const legendRows = useMemo(() => {
    return effectiveData.map((d, i) => ({
      ...d,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [effectiveData]);

  const spec: IPieChartSpec = useMemo(
    () => ({
      type: "pie",
      background: "transparent",

      // ✅ built-in legend-ийг унтраана (custom legend ашиглана)
      legends: [{ visible: false }],

      // ✅ chart palette
      color: PALETTE,

      data: [{ id: "id0", values: effectiveData }],
      valueField: "value",
      categoryField: "type",
      outerRadius: 1,
      innerRadius: 0.88,
      startAngle: -180,
      padAngle: 0.6,
      endAngle: 0,
      centerY: "80%",
      layoutRadius: "auto",

      pie: { style: { cornerRadius: 6 } },

      tooltip: {
        trigger: ["click", "hover"],
        mark: {
          title: { visible: false },
          content: [
            {
              key: (datum: Datum | undefined) => (datum as any)?.type,
              value: (datum: Datum | undefined) =>
                (datum as any)?.value != null
                  ? `${addThousandsSeparator(
                      Number(Number((datum as any).value).toFixed(1)),
                    )} мян ам.доллар`
                  : "",
            },
          ],
        },
      },

      indicator: [
        {
          visible: true,
          offsetY: "20%",
          title: {
            style: {
              text: "Нийт экспорт (мян $)",
              fontSize: 14,
              opacity: 0.7,
            },
          },
        },
        {
          visible: true,
          offsetY: "60%",
          title: {
            style: {
              text: `${addThousandsSeparator(Number(centerValue.toFixed(1)))} `,
              fontSize: 26,
            },
          },
        },
      ],
    }),
    [effectiveData, centerValue],
  );

  return (
    <div className="h-full w-full bg-transparent">
      {/* 2 багана: Chart | Legend */}
      <div className="grid h-full w-full grid-cols-1 gap-4 bg-transparent laptop:grid-cols-[1fr_220px]">
        <div className="h-full w-full bg-transparent [&_canvas]:bg-transparent [&_svg]:bg-transparent">
          <VChart spec={spec} />
        </div>

        {/* ✅ Custom legend (өнгө + нэр + утга) */}
        <div className="flex h-full flex-col justify-center gap-2 pr-2">
          {legendRows.map((r) => (
            <div key={r.type} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground/90">
                {r.type}
              </span>
              <span className="tabular-nums text-muted-foreground/80">
                {addThousandsSeparator(Number(r.value.toFixed(1)))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
