// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\conversions\index.tsx
"use client";

import { CirclePercent } from "lucide-react";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";

type Props = {
  data: Conversion[] | null;
};

/**
 * Item-ийн value + unit-ийг "сая тн" рүү хөрвүүлнэ.
 * - "сая" -> хэвээр
 * - "мян" -> / 1000
 * - бусад -> fallback (тонн гэж үзээд / 1_000_000)
 */
function toMillionTon(value: number, unit: string) {
  const u = (unit || "").toLowerCase();
  if (u.includes("сая")) return value;
  if (u.includes("мян")) return value / 1000;
  return value / 1_000_000;
}

// ✅ Chart дээрхтэй ижил өнгөний mapping
function pickColorByName(name: string) {
  const n = (name || "").toLowerCase();

  // - Тод цэнхэр = Жонш
  // - Бүдэг цэнхэр = Зэсийн баяжмал
  if (n.includes("жонш")) return "#2563eb"; // vivid blue
  if (n.includes("зэс")) return "#38bdf8"; // light blue

  // Бусад
  if (n.includes("нүүрс")) return "#f59e0b"; // orange
  if (n.includes("төмрийн хүдэр, баяжмал")) return "#22c55e"; // gray (төмрийн хүдэр)

  return "#94a3b8"; // fallback
}

function LegendDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function Convertions({ data }: Props) {
  const items = Array.isArray(data) ? data : [];

  return (
    <section className="flex h-full flex-col gap-2">
      <ChartTitle title="Биржийн арилжаа (өссөн дүн)" icon={CirclePercent} />

      <Indicator data={items} />

      <div className="relative max-h-80 flex-grow">
        {items.length > 0 ? (
          <Chart data={items} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Мэдээлэл алга.
          </div>
        )}
      </div>
    </section>
  );
}

function Indicator({ data }: { data: Conversion[] }) {
  if (!data.length) return null;

  // ✅ Нийт дүнг "сая тн" рүү normalize хийж бодно
  const totalMillion = data.reduce((acc, curr) => {
    const v = Number.isFinite(curr.value) ? Number(curr.value) : 0;
    const unit = curr.unit ?? "";
    return acc + toMillionTon(v, unit);
  }, 0);

  return (
    <div className="mt-3 space-y-2">
      <div>
        <span className="mr-1 text-2xl font-medium">
          {addThousandsSeparator(Number(totalMillion.toFixed(2)))}
        </span>
        <span className="text-muted-foreground/60">сая тн (нийт)</span>
      </div>

      <ul className="space-y-1 text-sm text-muted-foreground/80">
        {data.map((item) => {
          const v = Number.isFinite(item.value) ? Number(item.value) : 0;
          const unit = item.unit ?? "";
          const color = pickColorByName(item.name);

          return (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2">
                <LegendDot color={color} />
                <span>{item.name}</span>
              </span>

              <span className="tabular-nums">
                {addThousandsSeparator(Number(v.toFixed(3)))} {unit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}