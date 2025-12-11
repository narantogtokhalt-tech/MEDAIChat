// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\conversions\index.tsx
"use client";

import { useEffect, useState } from "react";
import { CirclePercent } from "lucide-react";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";

// FastAPI backend (Netlify дээр NEXT_PUBLIC_CHAT_API_BASE заавал тохирсон байх)
const backend = process.env.NEXT_PUBLIC_CHAT_API_BASE;

// Backend → Conversion хэлбэр рүү normalize хийх туслах функц
function normalizeConversion(raw: any, idx: number): Conversion {
  return {
    key: String(raw.key ?? raw.code ?? raw.name ?? idx),
    name: String(raw.name ?? raw.code ?? `Item ${idx + 1}`),
    // value may come from value / qty / total_qty / amount г.м.
    value: Number(
      raw.value ??
        raw.qty ??
        raw.quantity ??
        raw.total ??
        raw.total_qty ??
        0,
    ),
    // ✅ unit-ийг заавал өгөх (backend дээр unit байвал ашиглана, үгүй бол default)
    unit: String(raw.unit ?? "мян. тн"),
  };
}

export default function Convertions() {
  const [data, setData] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!backend) {
          console.error("NEXT_PUBLIC_CHAT_API_BASE is not set");
          return;
        }

        const res = await fetch(`${backend}/dashboard/exchange/timeline`, {
          cache: "no-store",
        });

        if (!res.ok) {
          console.error(
            "Backend error for /dashboard/exchange/timeline",
            res.status,
          );
          return;
        }

        const json = await res.json();

        let items: Conversion[] = [];

        // 1) Хэрвээ backend шууд массив буцааж байвал
        if (Array.isArray(json)) {
          items = json.map((row, i) => normalizeConversion(row, i));
        }
        // 2) Хэрвээ { items: [...] } хэлбэртэй байвал
        else if (Array.isArray(json.items)) {
          items = json.items.map((row: any, i: number) =>
            normalizeConversion(row, i),
          );
        }
        // 3) Хэрвээ өөр property-д массив байвал (жишээ нь data)
        else if (Array.isArray(json.data)) {
          items = json.data.map((row: any, i: number) =>
            normalizeConversion(row, i),
          );
        }

        setData(items);
      } catch (e) {
        console.error("Failed to load exchange timeline", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="flex h-full flex-col gap-2">
      <ChartTitle title="Биржийн арилжаа (өссөн дүн)" icon={CirclePercent} />
      <Indicator data={data} loading={loading} />
      <div className="relative max-h-80 flex-grow">
        {data.length > 0 ? (
          <Chart data={data} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {loading ? "Ачаалж байна…" : "Мэдээлэл алга."}
          </div>
        )}
      </div>
    </section>
  );
}

function Indicator({
  data,
  loading,
}: {
  data: Conversion[];
  loading: boolean;
}) {
  if (loading) {
    return <div className="mt-3 text-muted-foreground/60">Ачаалж байна…</div>;
  }

  const total = data.reduce((acc, curr) => acc + (curr.value ?? 0), 0);

  // Нэгдсэн unit – ихэнхдээ бүгд адил гэж үзээд эхний element-ээс авъя
  const unit = data[0]?.unit ?? "мян. тн";

  return (
    <div className="mt-3 space-y-2">
      <div>
        <span className="mr-1 text-2xl font-medium">
          {addThousandsSeparator(total)}
        </span>
        <span className="text-muted-foreground/60">
          {unit} (нийт өссөн дүн)
        </span>
      </div>

      {/* Бүтээгдэхүүн бүрийн тоон дүн */}
      <ul className="space-y-0.5 text-sm text-muted-foreground/80">
        {data.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-2"
          >
            <span>{item.name}</span>
            <span className="tabular-nums">
              {addThousandsSeparator(item.value)} {item.unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}