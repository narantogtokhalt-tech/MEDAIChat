"use client";

import { format, parseISO } from "date-fns";
import { useAtom, useAtomValue } from "jotai";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dateRangeAtom, rawTicketDataAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";

export function DatePickerWithRange({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [dateRange, setDateRange] = useAtom(dateRangeAtom);
  const data = useAtomValue(rawTicketDataAtom);

  // backend-с дата ачаалахаас өмнө хоосон байж болно
  const firstAvailableDate =
    data.length > 0
      ? data
          .map((d) => parseISO(d.date))
          .reduce((min, curr) => (curr < min ? curr : min))
      : new Date();

  const lastAvailableDate =
    data.length > 0
      ? data
          .map((d) => parseISO(d.date))
          .reduce((max, curr) => (curr > max ? curr : max))
      : new Date();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[276px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from ?? firstAvailableDate}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
            fromDate={firstAvailableDate}
            toDate={lastAvailableDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}