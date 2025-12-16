// D:\Projects\visactor-nextjs-template\src\components\Metrics.tsx

"use client";

import type { Metric } from "@/data/metrics";

type Props = {
  metrics: Metric[] | null;
  loading?: boolean; // optional: server loading.tsx ашиглавал хэрэггүй
};

export default function Metrics({ metrics, loading = false }: Props) {
  if (loading) {
    return <div className="p-4">Түр хүлээнэ үү…</div>;
  }

  if (!metrics || metrics.length === 0) {
    return <div className="p-4 text-muted-foreground">Metrics өгөгдөл алга.</div>;
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

            <div
              className={`text-xs font-medium ${
                isUp ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {isUp ? "▲" : "▼"} {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}