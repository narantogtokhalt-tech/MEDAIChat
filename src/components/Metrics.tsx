"use client";

import { useEffect, useState } from "react";
import type { Metric } from "@/data/metrics";

export default function Metrics() {
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/metrics");
        const data = await res.json();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-4">Түр хүлээнэ үү…</div>;
  }

  if (!metrics) {
    return <div className="p-4 text-red-500">Metrics ачаалахад алдаа гарлаа.</div>;
  }

  return (
    <div className="grid gap-4 laptop:grid-cols-4 tablet:grid-cols-2 grid-cols-1">
      {metrics.map((m) => {
        const isUp = m.change >= 0;
        const pct = Math.abs(m.change * 100).toFixed(1);

        return (
          <div
            key={m.title}
            className="rounded-xl border border-border p-4 flex flex-col gap-1"
          >
            <div className="text-sm text-muted-foreground">{m.title}</div>
            <div className="text-2xl font-semibold">{m.value}</div>

            <div className={`text-xs font-medium ${isUp ? "text-emerald-500" : "text-red-500"}`}>
              {isUp ? "▲" : "▼"} {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}