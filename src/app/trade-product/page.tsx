// src/app/trade-product/page.tsx
"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";
import itemIdsData from "@/data/itemids.json"; // D:\Projects\visactor-nextjs-template\src\data\itemids.json

type ForeignTradeRow = {
  id: number;
  companyName: string;
  companyRegnum: string;
  importExportFlag: string; // "E" эсвэл "I"
  amountUSD: string;
  quantity: string;
  itemId: string;
  itemName: string;
  measure: string;
  senderReceiver: string; // Улсын код (BE, CN, RU…)
  customs: string;
  month: string;
  year: number;
};

type ForeignTradeResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ForeignTradeRow[];
};

type ItemIdsConfig = {
  itemIds: string[];
};

const BASE_API = "http://192.168.0.210:8000";

const possibleYears = [2020, 2021, 2022, 2023, 2024, 2025];
const possibleMonths = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const itemIdOptions = (itemIdsData as ItemIdsConfig).itemIds;

type CellProps = {
  children: React.ReactNode;
  className?: string;
};

function Th({ children, className }: CellProps) {
  return (
    <th
      className={
        "px-3 py-2 text-left font-semibold text-slate-200 whitespace-nowrap " +
        (className ?? "")
      }
    >
      {children}
    </th>
  );
}

function Td({ children, className }: CellProps) {
  return (
    <td
      className={
        "px-3 py-1.5 text-slate-100 align-top whitespace-nowrap " +
        (className ?? "")
      }
    >
      {children}
    </td>
  );
}

export default function TradeProductPage() {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>(""); // HS код
  const [rows, setRows] = useState<ForeignTradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  const hasFilters = Boolean(selectedYear);

  async function fetchPage(url: string, pageNumber: number) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`API алдаа: ${res.status}`);
      }

      const data: ForeignTradeResponse = await res.json();
      setRows(data.results);
      setTotalCount(data.count);
      setNextUrl(data.next);
      setPrevUrl(data.previous);
      setPage(pageNumber);
    } catch (e: any) {
      setError(e?.message ?? "Өгөгдөл татах явцад алдаа гарлаа.");
      setRows([]);
      setTotalCount(null);
      setNextUrl(null);
      setPrevUrl(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetch() {
    if (!selectedYear) return;

    const params = new URLSearchParams();
    params.set("year", selectedYear);
    if (selectedMonth) params.set("month", selectedMonth);
    if (selectedItemId) {
      // Backend дээрх filter-ийн нэр (itemId) өөр бол энд соль
      params.set("itemId", selectedItemId);
    }
    params.set("page", "1");
    params.set("page_size", "1000"); // нэг хуудсанд 1000 мөр

    const url = `${BASE_API}/api/foreign_trade/?${params.toString()}`;
    await fetchPage(url, 1);
  }

  async function handleNextPage() {
    if (!nextUrl) return;
    await fetchPage(nextUrl, page + 1);
  }

  async function handlePrevPage() {
    if (!prevUrl) return;
    await fetchPage(prevUrl, page - 1);
  }

  const filteredRows = searchQuery
    ? rows.filter((row) =>
        (row.itemName ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : rows;

  // --- CSV export: сонгосон шүүлтүүрийн бүх хуудсыг татаж CSV болгоно ---
  async function handleExportCsvFull() {
    if (!selectedYear) {
      alert("Эхлээд жил сонгоно уу.");
      return;
    }

    setCsvLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("year", selectedYear);
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedItemId) {
        params.set("itemId", selectedItemId);
      }
      params.set("page", "1");
      params.set("page_size", "1000");

      let url: string | null = `${BASE_API}/api/foreign_trade/?${params.toString()}`;
      const allRows: ForeignTradeRow[] = [];

      while (url) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`API алдаа (CSV): ${res.status}`);
        }
        const data: ForeignTradeResponse = await res.json();
        allRows.push(...data.results);
        url = data.next;
      }

      if (allRows.length === 0) {
        alert("CSV татах өгөгдөл олдсонгүй.");
        return;
      }

      const headers = [
        "year",
        "month",
        "importExportFlag",
        "itemId",
        "itemName",
        "quantity",
        "measure",
        "amountUSD",
        "companyName",
        "companyRegnum",
        "senderReceiver",
        "customs",
      ];

      const csvRows = allRows.map((row) => [
        row.year,
        row.month,
        row.importExportFlag,
        row.itemId,
        row.itemName,
        row.quantity,
        row.measure,
        row.amountUSD,
        row.companyName,
        row.companyRegnum,
        row.senderReceiver,
        row.customs,
      ]);

      const escape = (v: any) =>
        `"${String(v ?? "").replace(/"/g, '""')}"`;

      const csvContent =
        [headers, ...csvRows]
          .map((r) => r.map(escape).join(","))
          .join("\r\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const urlBlob = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const y = selectedYear || "all";
      const m = selectedMonth || "all";
      const i = selectedItemId || "all";
      a.href = urlBlob;
      a.download = `foreign_trade_products_full_${y}_${m}_${i}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlBlob);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "CSV бэлтгэх явцад алдаа гарлаа.");
    } finally {
      setCsvLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-8">
        {/* Title / Intro */}
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Гадаад худалдаа – барааны кодоор (HS)
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Жил, сар, барааны HS код сонгож гадаад худалдааны (импорт / экспорт)
            өгөгдлийг API-аас татаж хүснэгтээр харна.
          </p>
        </header>

        {/* Filter card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/40 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Filter className="h-4 w-4 text-emerald-400" />
            Шүүлтүүр (жил, сар, барааны код)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            {/* Year */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Жил</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Жил сонгох</option>
                {possibleYears.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                Сар (сонголтоор)
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Бүх сар</option>
                {possibleMonths.map((m) => (
                  <option key={m} value={m}>
                    {m} сар
                  </option>
                ))}
              </select>
            </div>

            {/* ItemId (HS code) – searchable input + datalist */}
<div className="space-y-1">
  <label className="text-xs text-slate-400">
    Барааны код (HS, бичиж хайх / сонгох)
  </label>

  <input
    list="hs-code-list"
    value={selectedItemId}
    onChange={(e) => setSelectedItemId(e.target.value.trim())}
    placeholder="Жишээ нь: 76151000…"
    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
  />

  <datalist id="hs-code-list">
    {itemIdOptions.map((code) => (
      <option key={code} value={code} />
    ))}
  </datalist>

  <p className="text-[10px] text-slate-500">
    Жагсаалтаас сонгож болно, эсвэл HS кодын эхний цифрүүдийг бичиж хайна.
  </p>
</div>

            {/* Button */}
            <div className="flex items-end">
              <button
                onClick={handleFetch}
                disabled={!hasFilters || loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-900/40 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Search className="h-4 w-4" />
                {loading ? "Татаж байна…" : "Өгөгдөл татах"}
              </button>
            </div>
          </div>

          {/* Сонгосон шүүлтүүрийн summary */}
          <div className="text-xs text-slate-500 flex flex-wrap gap-3 justify-end">
            <span>
              Жил:{" "}
              <span className="text-slate-200">
                {selectedYear || "—"}
              </span>{" "}
              • Сар:{" "}
              <span className="text-slate-200">
                {selectedMonth || "бүх сар"}
              </span>{" "}
              • HS код:{" "}
              <span className="text-slate-200">
                {selectedItemId || "бүх код"}
              </span>
            </span>
          </div>
        </section>

        {/* Search + summary + CSV + pagination controls */}
        {rows.length > 0 && (
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-slate-400 space-y-1">
              <div>
                Нийт{" "}
                <span className="font-semibold text-slate-100">
                  {totalCount ?? rows.length}
                </span>{" "}
                бичлэг, энэ хуудсанд{" "}
                <span className="font-semibold text-slate-100">
                  {rows.length}
                </span>
                , хайлтын дараа{" "}
                <span className="font-semibold text-slate-100">
                  {filteredRows.length}
                </span>{" "}
                үлдсэн.
              </div>
              <div>
                Хуудас:{" "}
                <span className="font-semibold text-slate-100">
                  {page}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={!prevUrl || loading}
                  className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs sm:text-sm disabled:opacity-40"
                >
                  Өмнөх
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!nextUrl || loading}
                  className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs sm:text-sm disabled:opacity-40"
                >
                  Дараагийн
                </button>
              </div>
              <button
                onClick={handleExportCsvFull}
                disabled={!hasFilters || csvLoading}
                className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
              >
                {csvLoading
                  ? "CSV бэлтгэж байна…"
                  : "CSV татах (бүх өгөгдөл)"}
              </button>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Барааны нэрээр хайх…"
                  className="w-full sm:w-64 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </section>
        )}

        {/* Error / empty state */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && hasFilters && rows.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-6 text-sm text-slate-300">
            Сонгосон шүүлтүүрээр өгөгдөл олдсонгүй.
          </div>
        )}

        {/* Table */}
        {filteredRows.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="max-h-[600px] overflow-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-slate-900/80 sticky top-0 z-10">
                  <tr>
                    <Th>Огноо (Ж/С)</Th>
                    <Th>Им/Эк</Th>
                    <Th>Код</Th>
                    <Th className="w-[260px]">Барааны нэр</Th>
                    <Th>Тоо хэмжээ</Th>
                    <Th>Нэгж</Th>
                    <Th>Үнийн дүн (USD)</Th>
                    <Th>Компани</Th>
                    <Th>Регистр</Th>
                    <Th>Улсын код</Th>
                    <Th>Гааль</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-800/70 even:bg-slate-900/60 hover:bg-slate-800/60"
                    >
                      <Td>
                        <span className="font-medium text-slate-100">
                          {row.year}-{row.month}
                        </span>
                      </Td>
                      <Td>{row.importExportFlag}</Td>
                      <Td>{row.itemId}</Td>
                      <Td className="max-w-xs">
                        <span className="line-clamp-2">{row.itemName}</span>
                      </Td>
                      <Td>
                        {Number(row.quantity).toLocaleString("en-US", {
                          maximumFractionDigits: 1,
                        })}
                      </Td>
                      <Td>{row.measure}</Td>
                      <Td>
                        {Number(row.amountUSD).toLocaleString("en-US", {
                          maximumFractionDigits: 1,
                        })}
                      </Td>
                      <Td>
                        <div className="max-w-xs">
                          <span className="line-clamp-2">
                            {row.companyName}
                          </span>
                        </div>
                      </Td>
                      <Td>{row.companyRegnum}</Td>
                      <Td>{row.senderReceiver}</Td>
                      <Td>{row.customs}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}