// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\ticket-by-channels\chart.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type IPieChartSpec,
  VChart,
} from "@visactor/react-vchart";
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
  value: number; // сая ам.доллар
};

const MILLION = 1;

export default function Chart() {
  const [pieData, setPieData] = useState<PieDataItem[] | null>(null);
  const [yearLabel, setYearLabel] = useState<string | null>(null);
  const [exportTotalM, setExportTotalM] = useState<number | null>(null);

  // 1) Бүтээгдэхүүн별 үнийн дүн (жилийн нийлбэр) → сая ам.доллар
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/export/products-value-monthly");
        if (!res.ok) {
          console.error("Backend error for products-value-monthly");
          return;
        }
        const json: BackendProductsResp = await res.json();
        const products = json.products ?? [];
        const rows = json.monthly ?? [];

        if (!products.length || !rows.length) return;

        const lastRow = rows[rows.length - 1];
        const year = String(lastRow.year ?? lastRow.period ?? "");

        const items: PieDataItem[] = [];
        for (const p of products) {
          const raw = (lastRow as any)[p.code];
          const num = Number(raw);
          if (!Number.isFinite(num)) continue;

          // сая ам.доллар болгоно
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

  // 2) Нийт экспортын дүн (энэ жил) → сая ам.доллар
  useEffect(() => {
    async function loadTotal() {
      try {
        const res = await fetch("/api/export/total");
        if (!res.ok) {
          console.error("Backend error for export/total");
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

  // Backend байхгүй үед хуучин static-аа fallback болгоё (зүгээр туршилтад)
  const effectiveData: PieDataItem[] =
    pieData ??
    ticketByChannels.map((x) => ({
      type: x.type,
      value: x.value, // энд scale хийхгүй – fallback л учраас
    }));

  // Голд харагдах тоо → нийт экспорт (сая ам.доллар)
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
                      Number(datum.value.toFixed(1)),
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