// src/app/table/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Import,
  Globe2,
  Building2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import ChatbotWidget from "@/components/ChatbotWidget";

type Indicator = {
  id: number;
  name: string;
  href?: string;
};

const indicatorIcons = [BarChart3, Import, Globe2, Building2];

export default function TablePage() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/indicators.json")
      .then((res) => res.json())
      .then((data) => setIndicators(data))
      .catch(() => {
        setIndicators([
          { id: 1, name: "Нийт экспорт", href: "/export" },
          { id: 2, name: "Нийт импорт", href: "/import" },
          { id: 3, name: "Гадаад худалдаа /улсаар/", href: "/trade-country" },
          { id: 4, name: "Гадаад худалдаа /бүтээгдэхүүнээр/", href: "/trade-product" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleIndicators =
    indicators.length > 0
      ? indicators
      : [
          { id: 1, name: "Нийт экспорт", href: "/export" },
          { id: 2, name: "Нийт импорт", href: "/import" },
          { id: 3, name: "Гадаад худалдаа /улсаар/", href: "/trade-country" },
          { id: 4, name: "Гадаад худалдаа /бүтээгдэхүүнээр/", href: "/trade-product" },
        ];

  return (
    <main className="py-10 space-y-10">
      {/* ===== Header / Hero ===== */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span>Үзүүлэлтийн жагсаалт – дотоод хэрэглээ</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Үзүүлэлтийн нэрс
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base text-slate-300/80">
              Экспорт, импорт, гадаад худалдааны үндсэн үзүүлэлтүүдийг нэг жагсаалтаар
              харах бөгөөд тус бүр дээр нь дэлгэрэнгүй тайлан нээгдэнэ.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs sm:text-sm text-slate-200 shadow-lg shadow-black/30">
            <div className="flex flex-col">
              <span className="font-medium">
                Нийт {visibleIndicators.length} үзүүлэлт
              </span>
              <span className="text-slate-400">
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Үзүүлэлтийн grid ===== */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Үзүүлэлтийн жагсаалт
          </h2>
          <span className="text-xs text-slate-400">
            {loading ? "Өгөгдөл ачаалж байна…" : "JSON-оос амжилттай уншлаа"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {visibleIndicators.map((indicator, index) => {
            const Icon = indicatorIcons[index] || BarChart3;
            return (
              <Link
                href={indicator.href || "#"}
                key={indicator.id}
                className="
                  group relative block overflow-hidden rounded-2xl
                  border border-white/10
                  bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40
                  shadow-lg shadow-black/40
                  transition
                  hover:-translate-y-1 hover:border-blue-400/60
                  hover:shadow-xl hover:shadow-blue-900/40
                "
              >
                {/* glow */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-wide text-blue-200/80">
                      {String(indicator.id).padStart(2, "0")} дугаар үзүүлэлт
                    </div>
                    <div className="mt-1 text-sm sm:text-base font-semibold text-white">
                      {indicator.name}
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                      Дэлгэрэнгүй график, тайлан, тайлбарыг харах.
                    </p>
                  </div>

                  <ArrowUpRight className="mt-1 h-4 w-4 text-blue-200/70 group-hover:text-blue-100 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Floating chatbot widget – энэ хуудсан дээр ч гэсэн */}
      <ChatbotWidget />
    </main>
  );
}
