// src/app/ticket/page.tsx
"use client";

import ChatbotWidget from "@/components/ChatbotWidget";

export default function TicketPage() {
  return (
    <main className="py-10 space-y-10">
      {/* ===== Header / Hero ===== */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          Дотоод хэрэгцээнд – Макро, ЭЗ бодлогын газар
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Макро үзүүлэлтийн Power BI тайлан
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base text-slate-300/80">
              Өдөр тутмын автомат шинэчлэлттэй макро эдийн засгийн тайланг Power BI
              орчноос шууд харах боломжтой.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs sm:text-sm text-slate-200 shadow-lg shadow-black/30">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            <div className="flex flex-col">
              <span className="font-medium">LIVE • Internal</span>
              <span className="text-slate-400">Сүүлийн өгөгдлөөр шинэчлэгдсэн</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Power BI тайлан ===== */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4 space-y-4">
        <div
          className="
            relative w-full overflow-hidden
            rounded-2xl border border-white/15
            bg-slate-950/70 backdrop-blur-xl
            shadow-2xl shadow-black/60
          "
        >
          {/* top gradient overlay */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/50 to-transparent z-10" />

          <iframe
            src="https://app.powerbi.com/view?r=eyJrIjoiNjIzZmNhZGEtNjI1Yi00MWI5LTgzNzUtOTkzMzVmMDI1NzY3IiwidCI6IjNjY2ZiY2JhLTYzMTEtNGE0MS05YmIwLTM3ZGJlYmE1ODRlOCIsImMiOjEwfQ%3D%3D"
            title="Power BI report"
            className="w-full h-[420px] sm:h-[480px] border-0"
            allowFullScreen
          />
        </div>
      </section>

      {/* Floating chatbot widget – энэ хуудсан дээр бас харагдана */}
      <ChatbotWidget />
    </main>
  );
}