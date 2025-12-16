// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\average-tickets-created\card.tsx
"use client";

import { addThousandsSeparator } from "@/lib/utils";

export type SummaryCardItem = {
  type: string;
  name: string;
  color: string;
  total: number;
  last: number;
  avg?: number;
};

export type SummaryCardProps = {
  titleYear: string | null;
  subtitle: string;
  rangeText: string;
  items: SummaryCardItem[];
};

// ✅ Props-ийг optional болголоо (хаа нэгтээ <SummaryCard /> үлдсэн байсан ч compile эвдэхгүй)
export default function SummaryCard(props?: Partial<SummaryCardProps>) {
  const titleYear = props?.titleYear ?? null;
  const subtitle = props?.subtitle ?? "";
  const rangeText = props?.rangeText ?? "";
  const items = Array.isArray(props?.items) ? props!.items : [];

  // props байхгүй эсвэл items хоосон үед — юу ч гаргахгүй
  if (!subtitle && !rangeText && items.length === 0) return null;

  const maxTotal = Math.max(
    1,
    ...items.map((x) => (Number.isFinite(x.total) ? x.total : 0)),
  );

  return (
    <div
      className="
        rounded-2xl border border-border/50
        bg-background/70 p-4
        shadow-xl backdrop-blur-md
      "
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          {titleYear ? (
            <div className="text-2xl font-semibold tracking-tight">
              {titleYear}
            </div>
          ) : (
            <div className="text-sm font-medium text-foreground/90">
              Хугацаа
            </div>
          )}
          <div className="text-xs font-medium text-muted-foreground">
            {subtitle}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground/70 text-right">
          {rangeText}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((it) => {
          const total = Number.isFinite(it.total) ? it.total : 0;
          const last = Number.isFinite(it.last) ? it.last : 0;
          const pct = Math.max(0, Math.min(1, total / maxTotal));

          return (
            <div
              key={it.type}
              className={it.type === "2701" ? "rounded-xl bg-white/5 p-2" : ""}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: it.color }}
                  />
                  <span className="text-muted-foreground">
                    {it.type} - {it.name}
                  </span>
                </div>

                <span className="tabular-nums text-foreground/90">
                  {addThousandsSeparator(total)}
                </span>
              </div>

              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct * 100}%`,
                    backgroundColor: it.color,
                  }}
                />
              </div>

              <div className="mt-1 text-[11px] text-muted-foreground/70">
                Сүүлийн сар:{" "}
                <span className="tabular-nums text-foreground/80">
                  {addThousandsSeparator(last)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground/60">
        * Дүн нь сонгосон хугацааны нийлбэр (өссөн дүн)
      </div>
    </div>
  );
}