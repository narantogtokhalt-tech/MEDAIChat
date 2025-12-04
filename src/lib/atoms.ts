// src/lib/atoms.ts
"use client";

import { atom } from "jotai";
import type { DateRange } from "react-day-picker";
import { parseISO, isWithinInterval } from "date-fns";
import type { TicketMetric } from "@/types/types";

// 1) Backend-аас орж ирсэн бүх timeline
export const rawTicketDataAtom = atom<TicketMetric[]>([]);

// 2) Default → undefined биш, 2025 эхлэх range
export const dateRangeAtom = atom<DateRange | undefined>(undefined);

// 3) Range-аар шүүгдсэн chart дата
export const ticketChartDataAtom = atom((get) => {
  const range = get(dateRangeAtom);
  const data = get(rawTicketDataAtom);

  if (!range?.from || !range?.to) return data;

  return data.filter((item) => {
    const d = parseISO(item.date);
    return isWithinInterval(d, {
      start: range.from as Date,
      end: range.to as Date,
    });
  });
});