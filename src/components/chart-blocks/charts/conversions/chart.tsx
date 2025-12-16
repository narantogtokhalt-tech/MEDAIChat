// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\conversions\chart.tsx
"use client";

import { useMemo } from "react";
import { VChart } from "@visactor/react-vchart";
import type { ICirclePackingChartSpec } from "@visactor/vchart";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";

type ConversionWithShare = Conversion & {
  size?: number; // share fraction 0..1 (dashboard.ts)
  share?: number; // share fraction 0..1
};

const MIN_PACK = 0.002; // layout-д л ашиглана (~0.2%)

function pickColorByName(name: string) {
  const n = (name || "").toLowerCase();

  // - Тод цэнхэр = Жонш
  // - Бүдэг цэнхэр = Зэсийн баяжмал
  if (n.includes("жонш")) return "#2563eb";
  if (n.includes("зэс")) return "#38bdf8";

  if (n.includes("нүүрс")) return "#f59e0b";
  if (n.includes("төмрийн хүдэр, баяжмал")) return "#22c55e";

  return "#94a3b8";
}

const buildSpec = (values: ConversionWithShare[]): ICirclePackingChartSpec => ({
  type: "circlePacking",

  // ✅ хамгийн чухал: chart өөрөө transparent байх
  background: "transparent",

  data: [
    {
      id: "data",
      values: values.map((v) => {
        const share = Number.isFinite(v.size) ? Number(v.size) : 0;
        const pack = Math.max(MIN_PACK, Math.sqrt(Math.max(0, share)));

        return {
          ...v,

          // bubble size-г "value" талбарт хүчээр өгнө
          value: pack,

          share,

          displayValue: Number.isFinite((v as any).displayValue)
            ? Number((v as any).displayValue)
            : Number.isFinite(v.value)
              ? Number(v.value)
              : 0,
          displayUnit: (v as any).displayUnit ?? v.unit ?? "тн",

          color: pickColorByName(v.name),
        };
      }),
    },
  ],

  categoryField: "key",
  valueField: "value",

  drill: false,
  padding: 0,
  layoutPadding: 8,

  circlePacking: {
    style: {
      fill: (d: any) => d?.color,
    },
  },

  label: {
    visible: true,
    style: {
      fill: "white",
      textAlign: "center",
      textBaseline: "middle",
      visible: (d: any) => d.radius > 26,
      text: (d: any) => {
        const s = Number(d?.share);
        if (!Number.isFinite(s) || s < 0.05) return "";
        return `${(s * 100).toFixed(0)}%`;
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
          const name = d?.name ?? "";
          const val = Number.isFinite(d?.displayValue) ? Number(d.displayValue) : 0;
          const unit = d?.displayUnit ?? "тн";
          const s = Number.isFinite(d?.share) ? Number(d.share) : 0;

          return `${name}: ${addThousandsSeparator(Math.round(val))} ${unit} (${(
            s * 100
          ).toFixed(2)}%)`;
        },
      },
    },
  },

  animationEnter: { easing: "cubicInOut" },
  animationExit: { easing: "cubicInOut" },
  animationUpdate: { easing: "cubicInOut" },
});

export default function Chart({ data }: { data: Conversion[] }) {
  const safeData = (Array.isArray(data) ? data : []) as ConversionWithShare[];
  if (!safeData.length) return null;

  const spec = useMemo(() => buildSpec(safeData), [safeData]);

  return (
    <div className="h-full w-full bg-transparent">
      {/* ✅ canvas/svg/root бүгдэд transparent force */}
      <div className="h-full w-full bg-transparent [&_canvas]:bg-transparent [&_svg]:bg-transparent">
        <VChart spec={spec} />
      </div>
    </div>
  );
}