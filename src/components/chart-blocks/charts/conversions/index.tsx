// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\conversions\index.tsx
"use client";

import { useEffect, useState } from "react";
import { CirclePercent } from "lucide-react";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";

const backend = process.env.NEXT_PUBLIC_CHAT_API_BASE;

// Backend JSON-ийн хэлбэр
type BackendCommodity = {
  key: string;
  name: string;
  total_ton: number;
  total_scaled: number;
  unit_scaled: string;
};

type BackendResponse = {
  from: string;
  to: string;
  commodities: BackendCommodity[];
};

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

        const url = `${backend}/dashboard/exchange/timeline`;
        console.log("Loading exchange timeline from:", url);

        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          const text = await res.text();
          console.error(
            "Backend error for /dashboard/exchange/timeline",
            res.status,
            text,
          );
          return;
        }

        const json: BackendResponse = await res.json();
        console.log("exchange timeline raw json:", json);

        const commodities = json.commodities ?? [];

        // Backend → Conversion[] map
        const items: Conversion[] = commodities.map((c) => ({
          key: c.key,
          name: c.name,
          // total_scaled = хэмжээг scale хийсэн (сая тн / мян. тн)
          value: Number.isFinite(c.total_scaled)
            ? c.total_scaled
            : 0,
          // unit_scaled = "сая тн", "мян. тн" гэх мэт
          unit: c.unit_scaled || "мян. тн",
        }));

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

  if (!data.length) {
    return null;
  }

  const total = data.reduce(
    (acc, curr) =>
      acc + (Number.isFinite(curr.value) ? curr.value : 0),
    0,
  );

  // Энд нэгжийг ерөнхийд нь авъя (ихэнх нь "сая тн" байх)
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

      <ul className="space-y-0.5 text-sm text-muted-foreground/80">
        {data.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-2"
          >
            <span>{item.name}</span>
            <span className="tabular-nums">
              {addThousandsSeparator(
                Number.isFinite(item.value) ? item.value : 0,
              )}{" "}
              {item.unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}