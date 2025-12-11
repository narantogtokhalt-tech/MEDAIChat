// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\conversions\chart.tsx
"use client";

import { VChart } from "@visactor/react-vchart";
import type { ICirclePackingChartSpec } from "@visactor/vchart";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";

const buildSpec = (values: Conversion[]): ICirclePackingChartSpec => ({
  data: [
    {
      id: "data",
      values,
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
        if (!d.value) return "";
        const v = addThousandsSeparator(Math.round(d.value));
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
        value: (d: any) =>
          `${d?.name}: ${addThousandsSeparator(
            Math.round(d?.value ?? 0),
          )} мян. тн`,
      },
    },
  },

  animationEnter: { easing: "cubicInOut" },
  animationExit: { easing: "cubicInOut" },
  animationUpdate: { easing: "cubicInOut" },
});

export default function Chart({ data }: { data: Conversion[] }) {
  // Хоосон үед ч гэсэн spec-ээ аюулгүй байдлаар үүсгэнэ
  const safeData = Array.isArray(data) ? data : [];
  const spec = buildSpec(safeData);
  return <VChart spec={spec} />;
}