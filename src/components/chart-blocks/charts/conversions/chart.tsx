// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\conversions\chart.tsx
"use client";

import { useMemo } from "react";
import { VChart } from "@visactor/react-vchart";
import type { ICirclePackingChartSpec } from "@visactor/vchart";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";

const buildSpec = (values: Conversion[]): ICirclePackingChartSpec => ({
  data: [
    {
      id: "data",
      values: values.map((v) => ({
        ...v,
        value: Number.isFinite(v.value) ? v.value : 0,
      })),
    },
  ],
  type: "circlePacking",
  categoryField: "name",
  valueField: "value",
  drill: false,
  padding: 0,
  layoutPadding: 5,

  label: {
    visible: true,
    style: {
      fill: "white",
      fontWeight: 400,
      textAlign: "center",
      textBaseline: "middle",
      visible: (d: any) => d.radius > 30,
      text: (d: any) => {
        const n = Number(d.value);
        if (!Number.isFinite(n) || !n) return "";
        const v = addThousandsSeparator(Math.round(n));
        return `${v}`;
      },
      fontSize: (d: any) => Math.max(10, d.radius / 3),
    },
  },

  legends: [{ visible: false }],

  tooltip: {
    trigger: ["click", "hover"],
    mark: {
      content: {
        value: (d: any) => {
          const n = Number(d?.value);
          const v = Number.isFinite(n) ? n : 0;
          const unit = d?.unit ?? "мян. тн";
          return `${d?.name}: ${addThousandsSeparator(
            Math.round(v),
          )} ${unit}`;
        },
      },
    },
  },

  animationEnter: { easing: "cubicInOut" },
  animationExit: { easing: "cubicInOut" },
  animationUpdate: { easing: "cubicInOut" },
});

export default function Chart({ data }: { data: Conversion[] }) {
  const safeData = Array.isArray(data) ? data : [];
  if (!safeData.length) return null;

  const spec = useMemo(() => buildSpec(safeData), [safeData]);
  return <VChart spec={spec} />;
}