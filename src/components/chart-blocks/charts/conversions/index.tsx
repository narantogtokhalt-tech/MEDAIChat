"use client";

import { useEffect, useState } from "react";
import { CirclePercent } from "lucide-react";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";

export default function Convertions() {
  const [data, setData] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/exchange/commodities");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to load exchange commodities", e);
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

function Indicator({ data, loading }: { data: Conversion[]; loading: boolean }) {
  if (loading) {
    return <div className="mt-3 text-muted-foreground/60">Ачаалж байна…</div>;
  }

  const total = data.reduce((acc, curr) => acc + (curr.value ?? 0), 0);

  return (
    <div className="mt-3 space-y-2">
      <div>
        <span className="mr-1 text-2xl font-medium">
          {addThousandsSeparator(total)}
        </span>
        <span className="text-muted-foreground/60">
          мян. тн (нийт өссөн дүн)
        </span>
      </div>

      {/* Бүтээгдэхүүн бүрийн тоон дүн */}
      <ul className="space-y-0.5 text-sm text-muted-foreground/80">
        {data.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-2">
            <span>{item.name}</span>
            <span className="tabular-nums">
              {addThousandsSeparator(item.value)} мян. тн
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}