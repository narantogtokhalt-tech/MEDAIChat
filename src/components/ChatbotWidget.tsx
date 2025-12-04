"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  TerminalSquare,
  Sparkles,
  WifiOff,
  Loader2,
  CheckCircle2,
  FileText,
  Database,
  BarChart2,
} from "lucide-react";

// ========== CONFIG ==========
const DEFAULT_BACKEND = "http://127.0.0.1:8010";
const DEFAULT_API_KEY = "secret123";

const DEFAULT_SUGGESTIONS = [
  "Уул уурхайн биржийн арилжаа дээр 10 сарын нүүрсний хэлцлийн үнэ жигнэсэн дундаж үнэ хэд вэ?",
  "Нийт экспорт 12 сарын байдлаар хэд вэ?",
  "Нүүрсний 10 дугаар сарын экспортын үнийн дүн хэд вэ?",
  "Sxcoal-ийн 10 сарын коксжих нүүрсний дундаж үнэ хэд вэ?",
];

const PRODUCT_CHOICES = ["нүүрс", "зэс", "жонш", "төмөр", "газрын тос", "ALL"];
const METRIC_CHOICES = ["USD", "MNT", "тонн", "дундаж үнэ"];
const PERIOD_CHOICES = ["өдөр", "сар"];

function clsx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function joinUrl(base: string, path: string) {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

type ChatLog = {
  role: "user" | "bot";
  text: string;
  result?: unknown;
};

type Meta = any;

// ========== COMPONENT ==========

export default function ChatbotWidget({
  baseUrl = DEFAULT_BACKEND,
  apiKey = DEFAULT_API_KEY,
  title = "DataAnalystBot",
  defaultOpen = false,
  position = "bottom-right",
  metaInitiallyOpen = false,
  suggestions = DEFAULT_SUGGESTIONS,
  requestTimeoutMs = 25000,
  persistKey = "salesbot.chatlogs",
  startAtHome = true,
}: {
  baseUrl?: string;
  apiKey?: string;
  title?: string;
  defaultOpen?: boolean;
  position?: "bottom-right" | "bottom-left";
  metaInitiallyOpen?: boolean;
  suggestions?: string[];
  requestTimeoutMs?: number;
  persistKey?: string;
  startAtHome?: boolean;
}) {
  // ========== STATES ==========
  const [open, setOpen] = useState(defaultOpen);
  const [logs, setLogs] = useState<ChatLog[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(persistKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(metaInitiallyOpen);
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showHome, setShowHome] = useState(startAtHome);
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  // Stable session id
  const [sid] = useState(() => {
    if (typeof window === "undefined") return "web-xxxxxx";
    const k = persistKey + ".sid";
    let v = localStorage.getItem(k);
    if (v) return v;
    v = "web-" + Date.now().toString(36).slice(-6);
    localStorage.setItem(k, v);
    return v;
  });

  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Online/offline indicators
  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  // Save chat logs
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(persistKey, JSON.stringify(logs));
    }
  }, [logs, persistKey]);

  // Auto-scroll
  useEffect(() => {
    if (open && bodyRef.current && !showHome) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, open, showHome]);

  function pushBotText(text: string, result?: unknown) {
    setLogs((l) => [...l, { role: "bot", text, result }]);
  }

  // ========== FETCH HELPERS ==========

  async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
  ) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  // Quick-report
  async function fetchReport(path: string, label: string) {
    setShowHome(false);
    setReportLoading(label);
    setError(null);

    try {
      const url = joinUrl(baseUrl, path);
      const headers: Record<string, string> = { accept: "application/json" };
      if (apiKey) headers["x-api-key"] = String(apiKey);

      const res = await fetchWithTimeout(url, { headers }, requestTimeoutMs);
      const data = await res.json();
      pushBotText(data?.text || JSON.stringify(data, null, 2));
    } catch (err: any) {
      const msg =
        err?.name === "AbortError"
          ? "Серверээс удаан хариу ирлээ (timeout)."
          : err.message;
      pushBotText("Алдаа: " + msg);
      setError(msg);
    } finally {
      setReportLoading(null);
    }
  }

  // Send message
  async function send(msg?: string) {
    const text = (msg ?? message).trim();
    if (!text || loading) return;

    // Slash commands
    if (text === "/daily") return fetchReport("report/daily", "daily");
    if (text === "/exchange") return fetchReport("report/exchange", "exchange");
    if (text === "/export")
      return fetchReport("report/export-products", "export");

    setLogs((l) => [...l, { role: "user", text }]);
    setMessage("");
    setLoading(true);
    setShowHome(false);
    setError(null);

    try {
      const url = joinUrl(baseUrl, "chat");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (apiKey) headers["x-api-key"] = String(apiKey);

      const res = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ message: text, session_id: sid }),
        },
        requestTimeoutMs,
      );

      const data = await res.json();
      pushBotText(data.answer, data.result);
      setMeta(data.meta ?? null);
    } catch (err: any) {
      const msg =
        err?.name === "AbortError"
          ? "Серверээс удаан хариу ирлээ."
          : err.message;
      pushBotText("Алдаа: " + msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ========== CLARIFY PANEL ==========
  const needClarify = meta?.need_clarification && meta?.clarify_token;
  const missing: string[] = Array.isArray(meta?.missing) ? meta.missing : [];

  const [clarProduct, setClarProduct] = useState("");
  const [clarMetric, setClarMetric] = useState("");
  const [clarPeriod, setClarPeriod] = useState("");
  const [clarDate, setClarDate] = useState("");
  const [clarLoading, setClarLoading] = useState(false);
  const [clarError, setClarError] = useState<string | null>(null);

  async function sendClarify() {
    setClarLoading(true);
    setClarError(null);
    try {
      const url = joinUrl(baseUrl, "clarify");

      const answer = [clarProduct, clarMetric, clarPeriod, clarDate]
        .filter(Boolean)
        .join(", ");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (apiKey) headers["x-api-key"] = String(apiKey);

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          token: meta.clarify_token,
          answer,
        }),
      });

      const data = await res.json();
      pushBotText(data.answer, data.result);
      setMeta(data.meta ?? null);

      setClarProduct("");
      setClarMetric("");
      setClarPeriod("");
      setClarDate("");
    } catch (err: any) {
      setClarError(err.message);
    } finally {
      setClarLoading(false);
    }
  }

  // Floating button position
  const posClass =
    position === "bottom-right" ? "right-6 bottom-6" : "left-6 bottom-6";

  // ========== JSX RETURN ==========

  return (
    <div className="z-[1000]">
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "fixed",
          posClass,
          "w-14 h-14 rounded-full flex items-center justify-center",
          "bg-gradient-to-tr from-sky-500 via-blue-600 to-emerald-500",
          "shadow-[0_18px_45px_rgba(15,23,42,0.75)] ring-2 ring-sky-400/70",
          "text-white hover:scale-105 active:scale-95 transition-transform",
        )}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Panel */}
      {open && (
        <div
          className={clsx(
            "fixed bottom-28",
            position === "bottom-right" ? "right-6" : "left-6",
            "w-[420px] max-w-[92vw]",
            "rounded-3xl border border-slate-700/70",
            "bg-slate-900/90 backdrop-blur-2xl",
            "shadow-[0_28px_80px_rgba(15,23,42,0.95)] overflow-hidden",
            "text-slate-50",
          )}
        >
          {/* HEADER */}
          <div className="relative border-b border-slate-700/80">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-600/80 via-blue-700/80 to-emerald-500/75 opacity-90" />
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles className="w-5 h-5 text-sky-100" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-wide">
                    {title}
                  </span>
                  <span className="text-[11px] text-sky-100/80">
                    Макро, гадаад худалдааны ассистент
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                    online
                      ? "bg-emerald-900/70 text-emerald-100 border border-emerald-500/60"
                      : "bg-amber-900/70 text-amber-100 border border-amber-500/60",
                  )}
                >
                  <span
                    className={clsx(
                      "h-2 w-2 rounded-full",
                      online ? "bg-emerald-400" : "bg-amber-400",
                    )}
                  />
                  {online ? "Online" : "Offline"}
                </span>

                <button
                  onClick={() => setShowMeta(!showMeta)}
                  className="hidden sm:flex text-[11px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sky-50 items-center gap-1"
                >
                  <TerminalSquare className="w-3 h-3" /> Meta
                </button>

                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sky-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative px-4 pb-2 text-[10px] text-sky-50/80 flex justify-between">
              <span>session: {sid}</span>
              <button
                onClick={() => setShowHome(true)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-sky-900/60 hover:bg-sky-800/80"
              >
                Home
              </button>
            </div>
          </div>

          {/* BODY */}
          <div
            ref={bodyRef}
            className="h-[460px] overflow-auto p-3 bg-gradient-to-b from-slate-900/80 via-slate-950/95 to-slate-950"
          >
            {showHome ? (
              <div className="p-2 text-sm space-y-4">
                <div>
                  <div className="font-medium mb-1 text-slate-50">
                    Тавтай морил 👋
                  </div>
                  <div className="text-xs text-slate-300">
                    Өдөр тутмын тайлан, биржийн арилжаа, экспортын бүтэцтэй
                    холбоотой асуултаа шууд асуугаарай.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => fetchReport("report/daily", "daily")}
                    className="border border-slate-700/80 p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 transition flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-50">
                          Нэгдсэн тайлан
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Өдөр тутмын гол үзүүлэлтүүд
                        </span>
                      </div>
                      {reportLoading === "daily" && (
                        <Loader2 className="w-3 h-3 animate-spin ml-auto text-sky-300" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => fetchReport("report/exchange", "exchange")}
                    className="border border-slate-700/80 p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 transition flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-50">
                          Биржийн арилжаа
                        </span>
                        <span className="text-[11px] text-slate-400">
                          УУБ-ийн арилжааны хэмжээ, үнэ
                        </span>
                      </div>
                      {reportLoading === "exchange" && (
                        <Loader2 className="w-3 h-3 animate-spin ml-auto text-emerald-300" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      fetchReport("report/export-products", "export")
                    }
                    className="border border-slate-700/80 p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 transition flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-50">
                          Экспорт бүтээгдэхүүнээр
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Бүтээгдэхүүн тус бүрийн дүн
                        </span>
                      </div>
                      {reportLoading === "export" && (
                        <Loader2 className="w-3 h-3 animate-spin ml-auto text-purple-300" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-2">
                    Жишээ асуултууд
                    <span className="h-px flex-1 bg-slate-700" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="bg-slate-900/70 border border-slate-700/80 hover:bg-slate-800/90 text-slate-100 p-2 rounded-2xl text-left text-xs transition"
                        onClick={() => send(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {logs.map((m, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "mb-2 flex",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={clsx(
                        "max-w-[80%] rounded-2xl text-sm px-3 py-2 whitespace-pre-wrap leading-relaxed",
                        m.role === "user"
                          ? "bg-sky-600 text-slate-50 rounded-br-md shadow-md shadow-sky-900/40"
                          : "bg-slate-800/90 text-slate-100 rounded-bl-md border border-slate-700/80",
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {needClarify && (
                  <div className="bg-amber-950/60 border border-amber-700/80 p-3 rounded-2xl mt-2 space-y-2 text-xs text-amber-50">
                    <div className="font-medium text-[11px]">
                      Тодруулга шаардлагатай байна.
                    </div>

                    {missing.includes("product") && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-amber-50/90">
                          Бүтээгдэхүүн
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {PRODUCT_CHOICES.map((p) => (
                            <button
                              key={p}
                              onClick={() => setClarProduct(p)}
                              className={clsx(
                                "px-2 py-1 rounded-full text-[11px] border",
                                clarProduct === p
                                  ? "bg-amber-400 text-amber-950 border-amber-300"
                                  : "bg-transparent border-amber-700/80 text-amber-50",
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {missing.includes("metric") && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-amber-50/90">
                          Хэмжигдэхүүн
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {METRIC_CHOICES.map((p) => (
                            <button
                              key={p}
                              onClick={() => setClarMetric(p)}
                              className={clsx(
                                "px-2 py-1 rounded-full text-[11px] border",
                                clarMetric === p
                                  ? "bg-amber-400 text-amber-950 border-amber-300"
                                  : "bg-transparent border-amber-700/80 text-amber-50",
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {missing.includes("period") && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-amber-50/90">
                          Хугацааны түвшин
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {PERIOD_CHOICES.map((p) => (
                            <button
                              key={p}
                              onClick={() => setClarPeriod(p)}
                              className={clsx(
                                "px-2 py-1 rounded-full text-[11px] border",
                                clarPeriod === p
                                  ? "bg-amber-400 text-amber-950 border-amber-300"
                                  : "bg-transparent border-amber-700/80 text-amber-50",
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {missing.includes("date") && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-amber-50/90">
                          Огноо
                        </div>
                        <input
                          type="date"
                          value={clarDate}
                          onChange={(e) => setClarDate(e.target.value)}
                          className="border border-amber-600/80 bg-amber-950/40 rounded px-2 py-1 text-[11px] text-amber-50 outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                    )}

                    <button
                      onClick={sendClarify}
                      disabled={clarLoading}
                      className="mt-1 bg-amber-400 text-amber-950 px-3 py-1 rounded-full text-[11px] flex items-center gap-1 hover:bg-amber-300 disabled:opacity-70"
                    >
                      {clarLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Илгээх
                    </button>

                    {clarError && (
                      <div className="text-[11px] text-red-300 mt-1">
                        {clarError}
                      </div>
                    )}
                  </div>
                )}

                {loading && (
                  <div className="flex justify-start mt-3">
                    <div className="bg-slate-800/90 px-3 py-2 rounded-2xl flex items-center gap-2 text-xs text-slate-100 border border-slate-700/80">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
                      Хариулт боловсруулж байна…
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* META PANEL */}
          {showMeta && (
            <div className="border-t border-slate-800/80 p-3 bg-slate-950/95">
              <div className="text-[11px] text-slate-400 mb-1">
                Meta / debug мэдээлэл
              </div>
              <pre className="text-[10px] text-slate-300 overflow-auto max-h-40 bg-slate-900/70 rounded-lg p-2 border border-slate-800/80">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </div>
          )}

          {/* FOOTER */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/95">
            {error && (
              <div className="text-[11px] text-red-400 mb-1">{error}</div>
            )}
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                className="flex-1 border border-slate-700/80 bg-slate-900/70 rounded-2xl px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-sky-500/80"
                placeholder="Жишээ: 7 сарын нүүрсний хэлцлийн дүн хэд вэ?"
              />

              <button
                onClick={() => send()}
                disabled={loading || !online}
                className={clsx(
                  "w-11 h-11 rounded-2xl flex items-center justify-center",
                  "bg-gradient-to-tr from-sky-500 via-blue-600 to-emerald-500",
                  "text-white hover:brightness-110 active:scale-95 transition",
                  (!online || loading) && "opacity-70 cursor-not-allowed",
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-x-2">
              <span>Enter = Илгээх • Shift+Enter = шинэ мөр</span>
              <span className="hidden sm:inline">• Комманд: /daily /exchange /export</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}