// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\ticket-by-channels\chart.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { type IPieChartSpec, VChart } from "@visactor/react-vchart";
import type { Datum } from "@visactor/vchart/esm/typings";
import { ticketByChannels } from "@/data/ticket-by-channels"; // fallback-д л ашиглана
import { addThousandsSeparator } from "@/lib/utils";

type BackendProduct = {
  code: string;
  name: string;
  unit: string;
};

type BackendYearRow = {
  year: number;
  period: string;
  [code: string]: number | string;
};

type BackendProductsResp = {
  products: BackendProduct[];
  monthly: BackendYearRow[];
};

type ExportTotal = {
  date: string;
  export_this_year: number | null;
  export_prev_same_day: number | null;
  yoy_pct: number | null;
};

type PieDataItem = {
  type: string; // name
  value: number; // мян ам.доллар (tooltip-доо "мян ам.доллар" гэж харуулж байгаа)
};

const MILLION = 1; // одоогийн backend scale-тайгаа таарч байгаагаар нь хэвээр нь үлдээе

// FastAPI backend (Netlify дээр NEXT_PUBLIC_CHAT_API_BASE заавал тохирсон байх)
const backend = process.env.NEXT_PUBLIC_CHAT_API_BASE;

export default function Chart() {
  const [pieData, setPieData] = useState<PieDataItem[] | null>(null);
  const [yearLabel, setYearLabel] = useState<string | null>(null);
  const [exportTotalM, setExportTotalM] = useState<number | null>(null);

  // 1) Бүтээгдэхүүн별 үнийн дүн (жилийн нийлбэр)
  useEffect(() => {
    async function loadProducts() {
      try {
        if (!backend) {
          console.error("NEXT_PUBLIC_CHAT_API_BASE is not set");
          return;
        }

        // Өмнө нь: /api/export/products-value-monthly
        const res = await fetch(
          `${backend}/dashboard/export/products-value-monthly`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          console.error(
            "Backend error for /dashboard/export/products-value-monthly",
            res.status,
          );
          return;
        }

        const json: BackendProductsResp = await res.json();
        const products = json.products ?? [];
        const rows = json.monthly ?? [];

        if (!products.length || !rows.length) return;

        const lastRow = rows[rows.length - 1];
        const year = String((lastRow as any).year ?? (lastRow as any).period ?? "");

        const items: PieDataItem[] = [];
        for (const p of products) {
          const raw = (lastRow as any)[p.code];
          const num = Number(raw);
          if (!Number.isFinite(num)) continue;

          const scaled = num / MILLION;
          items.push({
            type: p.name,
            value: scaled,
          });
        }

        if (items.length) {
          setPieData(items);
          setYearLabel(year);
        }
      } catch (e) {
        console.error("Failed to load products-value-monthly", e);
      }
    }

    loadProducts();
  }, []);

  // 2) Нийт экспортын дүн (энэ жил)
  useEffect(() => {
    async function loadTotal() {
      try {
        if (!backend) {
          console.error("NEXT_PUBLIC_CHAT_API_BASE is not set");
          return;
        }

        // Өмнө нь: /api/export/total
        const res = await fetch(
          `${backend}/dashboard/export/total`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          console.error("Backend error for /dashboard/export/total", res.status);
          return;
        }

        const json: ExportTotal = await res.json();
        const v = json.export_this_year;
        if (v != null) {
          setExportTotalM(v / MILLION);
        }
      } catch (e) {
        console.error("Failed to load export total", e);
      }
    }

    loadTotal();
  }, []);

  // Backend байхгүй үед static fallback
  const effectiveData: PieDataItem[] =
    pieData ??
    ticketByChannels.map((x) => ({
      type: x.type,
      value: x.value,
    }));

  // Голд харагдах тоо → нийт экспорт
  const centerValue =
    exportTotalM != null
      ? exportTotalM
      : effectiveData.reduce((acc, c) => acc + (c.value || 0), 0);

  const spec: IPieChartSpec = useMemo(
    () => ({
      type: "pie",
      legends: [
        {
          type: "discrete",
          visible: true,
          orient: "bottom",
        },
      ],
      data: [
        {
          id: "id0",
          values: effectiveData,
        },
      ],
      valueField: "value",
      categoryField: "type",
      outerRadius: 1,
      innerRadius: 0.88,
      startAngle: -180,
      padAngle: 0.6,
      endAngle: 0,
      centerY: "80%",
      layoutRadius: "auto",
      pie: {
        style: {
          cornerRadius: 6,
        },
      },
      tooltip: {
        trigger: ["click", "hover"],
        mark: {
          title: {
            visible: false,
          },
          content: [
            {
              key: (datum: Datum | undefined) => datum?.type,
              value: (datum: Datum | undefined) =>
                datum?.value != null
                  ? `${addThousandsSeparator(
                      Number((datum.value as number).toFixed(1)),
                    )} мян ам.доллар`
                  : "",
            },
          ],
        },
      },
      indicator: [
        {
          visible: true,
          offsetY: "40%",
          title: {
            style: {
              text: yearLabel
                ? `Экспорт (үнийн дүн,мян $)`
                : "Экспорт бүтээгдэхүүн (үнийн дүн)",
              fontSize: 14,
              opacity: 0.7,
            },
          },
        },
        {
          visible: true,
          offsetY: "64%",
          title: {
            style: {
              text: `${addThousandsSeparator(
                Number(centerValue.toFixed(1)),
              )} `,
              fontSize: 26,
            },
          },
        },
      ],
    }),
    [effectiveData, centerValue, yearLabel],
  );

  return <VChart spec={spec} />;
}