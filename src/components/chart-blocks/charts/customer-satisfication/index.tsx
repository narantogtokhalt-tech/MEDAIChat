// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\customer-satisfication\index.tsx
"use client";

import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import ChartTitle from "../../components/chart-title";
import { cn } from "@/lib/utils";

type CoalItem = {
  name: string;
  latest: number | null;
  prev_year: number | null;
  yoy_pct: number | null;
};

export type CoalResponse = {
  date: string;
  items: CoalItem[];
};

type Props = {
  data: CoalResponse | null;
};

export default function CustomerSatisfication({ data }: Props) {
  const items = data?.items ?? [];

  return (
    <section className="flex h-full flex-col gap-2">
      <ChartTitle title="Коксжих нүүрсний үнэ (юн/тн)" icon={Flame} />
      <div className="my-4 flex h-full items-center justify-between">
        <div className="mx-auto grid w-full grid-cols-2 gap-6">
          <Summary date={data?.date} />

          {items.length > 0 ? (
            items.map((item) => <PriceRow key={item.name} item={item} />)
          ) : (
            <div className="col-span-2 text-sm text-muted-foreground">
              Мэдээлэл алга.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Summary({ date }: { date?: string }) {
  return (
    <div className="flex flex-col items-start justify-center">
      <div className="text-xs text-muted-foreground">
        Сүүлийн өдрийн ханшийн өөрчлөлт
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        Огноо: {date ?? "—"}
      </div>
    </div>
  );
}

function PriceRow({ item }: { item: CoalItem }) {
  const yoy = item.yoy_pct ?? 0;
  const hasYoy = item.yoy_pct !== null && !Number.isNaN(item.yoy_pct);

  const isUp = yoy > 0;
  const isDown = yoy < 0;

  const colorClass = hasYoy
    ? isUp
      ? "text-emerald-400"
      : isDown
        ? "text-red-400"
        : "text-muted-foreground"
    : "text-muted-foreground";

  const Icon = isUp ? TrendingUp : TrendingDown;

  const latestText =
    item.latest != null
      ? item.latest.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "—";

  const yoyText = hasYoy ? `${yoy > 0 ? "+" : ""}${yoy.toFixed(2)}%` : "—";

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-muted-foreground">{item.name}</div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{latestText}</span>
          <span className="text-[11px] text-muted-foreground"></span>
        </div>

        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", colorClass)} />
          <span className={cn("text-lg font-semibold", colorClass)}>{yoyText}</span>
        </div>
      </div>
    </div>
  );
}