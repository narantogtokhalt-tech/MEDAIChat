"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";

type ImportRow = {
  id: number;
  SumOfamountUSD: string;
  itemId: string;
  itemName: string;
  measure: string;
  SumOfquantity: string;
  senderReceiver: string;
  country: string;
  month: string;
  year: number;
};

const BASE_API = "http://192.168.0.210:8000";
const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"];
const MONTHS = [
  { value: "01", label: "01 сар" },
  { value: "02", label: "02 сар" },
  { value: "03", label: "03 сар" },
  { value: "04", label: "04 сар" },
  { value: "05", label: "05 сар" },
  { value: "06", label: "06 сар" },
  { value: "07", label: "07 сар" },
  { value: "08", label: "08 сар" },
  { value: "09", label: "09 сар" },
  { value: "10", label: "10 сар" },
  { value: "11", label: "11 сар" },
  { value: "12", label: "12 сар" },
];

type ApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ImportRow[];
};

export default function ImportPage() {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("09");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");

  function buildUrl(page: number, pageSize: number) {
    const params = new URLSearchParams();
    params.set("year", year);
    params.set("month", month);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    return `${BASE_API}/api/import_monthly/?${params.toString()}`;
  }

  // 1000 мөрөөр ачаалах (backend зөвшөөрч байвал 1000-ыг өгнө, үгүй бол 100 хариулна)
  async function handleFetch() {
    setLoading(true);
    try {
      const url = buildUrl(1, 1000);
      const res = await fetch(url);
      if (!res.ok) throw new Error("API error");
      const data: ApiResponse = await res.json();
      setRows(data.results);
      setTotalCount(data.count ?? data.results.length);
      setNextUrl(data.next);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotalCount(null);
      setNextUrl(null);
    } finally {
      setLoading(false);
    }
  }

  // Дараагийн хуудас (1000 / 100 – backend-ээс хамаарна)
  async function handleLoadMore() {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const res = await fetch(nextUrl);
      if (!res.ok) throw new Error("API error");
      const data: ApiResponse = await res.json();
      setRows((prev) => [...prev, ...data.results]);
      setNextUrl(data.next);
      setTotalCount(data.count ?? data.results.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // --- бүх хуудсыг CSV-ээр татах ---
  async function handleExportAllCsv() {
    if (!year || !month) return;
    setExporting(true);

    try {
      let url: string | null = buildUrl(1, 1000); // 1000 гэж өгсөн ч 100-р тасалбал зүгээр
      const all: ImportRow[] = [];

      while (url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error while exporting");
        const data: ApiResponse = await res.json();
        all.push(...data.results);
        url = data.next;
      }

      if (!all.length) {
        alert("Экспорт хийх өгөгдөл олдсонгүй.");
        return;
      }

      downloadCsv(all, year, month);
    } catch (e) {
      console.error(e);
      alert("CSV экспорт хийхэд алдаа гарлаа.");
    } finally {
      setExporting(false);
    }
  }

  const filteredRows = search
    ? rows.filter((r) =>
        r.itemName.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;

  const loadedCount = rows.length;
  const filteredCount = filteredRows.length;

  return (
    <main className="space-y-6 py-6">
      {/* ... дээрх гарчиг, filter UI тань энд байна гэж үзье ... */}
      {/* Filter panel + search + buttons */}
      <section className="mx-auto max-w-6xl space-y-4 px-3">
        {/* filter row */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
            <Filter className="h-4 w-4 text-emerald-400" />
            <span>Шүүлтүүр (жил, сар)</span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              {/* year select */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Жил</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="h-10 rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-100"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {/* month select */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Сар (сонголтоор)</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-10 rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-100"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <button
                onClick={handleFetch}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                Өгөгдөл татах
              </button>

              <div className="flex gap-2 text-[11px] text-slate-400">
                <span>Сонгосон жил: {year || "—"}</span>
                <span>•</span>
                <span>Сар: {month || "бүгд"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* search + CSV buttons */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Барааны нэрээр хайх…"
              className="h-9 w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLoadMore}
              disabled={!nextUrl || loading}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              Дараагийн хуудсыг татах
            </button>

            <button
              onClick={handleExportAllCsv}
              disabled={exporting || !rows.length}
              className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white shadow hover:bg-blue-400 disabled:opacity-60"
            >
              {exporting ? "CSV экспортлож байна…" : "CSV – бүх өгөгдөл"}
            </button>
          </div>
        </div>

        {/* summary text */}
        {totalCount !== null && (
          <div className="text-xs text-slate-400">
            Нийт {totalCount.toLocaleString()} бичлэг,{" "}
            {loadedCount.toLocaleString()} мөр ачаалсан, хайлтын дараа{" "}
            {filteredCount.toLocaleString()} үлдсэн.
          </div>
        )}

        {/* table */}
        <div className="mt-2 overflow-auto rounded-2xl border border-white/10 bg-slate-950/80">
          <table className="min-w-full text-left text-xs text-slate-100">
            <thead className="bg-slate-900/80 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Огноо (Ж/С)</th>
                <th className="px-3 py-2">Код</th>
                <th className="px-3 py-2">Барааны нэр</th>
                <th className="px-3 py-2">Тоо хэмжээ</th>
                <th className="px-3 py-2">Нэгж</th>
                <th className="px-3 py-2">Үнийн дүн (USD)</th>
                <th className="px-3 py-2">Улс</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800/80">
                  <td className="px-3 py-1.5">
                    {row.year}-{row.month}
                  </td>
                  <td className="px-3 py-1.5">{row.itemId}</td>
                  <td className="px-3 py-1.5 max-w-xs truncate">
                    {row.itemName}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {Number(row.SumOfquantity).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-1.5">{row.measure}</td>
                  <td className="px-3 py-1.5 text-right">
                    {Number(row.SumOfamountUSD).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-1.5">{row.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/** CSV татаж авах жижиг helper */
function downloadCsv(rows: ImportRow[], year: string, month: string) {
  const header = [
    "year",
    "month",
    "itemId",
    "itemName",
    "measure",
    "SumOfquantity",
    "SumOfamountUSD",
    "senderReceiver",
    "country",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.year,
        r.month,
        `"${(r.itemId || "").replace(/"/g, '""')}"`,
        `"${(r.itemName || "").replace(/"/g, '""')}"`,
        `"${(r.measure || "").replace(/"/g, '""')}"`,
        r.SumOfquantity,
        r.SumOfamountUSD,
        `"${(r.senderReceiver || "").replace(/"/g, '""')}"`,
        `"${(r.country || "").replace(/"/g, '""')}"`,
      ].join(","),
    ),
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `import_${year}_${month}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}