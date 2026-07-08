"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import IconAltArrowLeft from "../icons/AltArrowLeft";
import IconAltArrowRight from "../icons/AltArrowRight";
import { IconCheck } from "../icons";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface MonthYearGridPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  startMonth?: number; // 0-indexed month (0 = January)
  startYear?: number;
}

export function MonthYearGridPicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
  startMonth = 4, // May (0-indexed)
  startYear,
}: MonthYearGridPickerProps) {
  const now = new Date();
  const defaultStartYear = startYear ?? now.getFullYear();
  const defaultStartMonth = startMonth;

  const [open, setOpen] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState(() => {
    // Parse value if provided, otherwise use current year
    if (value) {
      const parts = value.split(" ");
      return parseInt(parts[parts.length - 1]);
    }
    return defaultStartYear;
  });

  // Get available months for the selected year
  const availableMonths = React.useMemo(() => {
    const months: {
      index: number;
      name: string;
      short: string;
      disabled: boolean;
    }[] = [];

    for (let i = 0; i < 12; i++) {
      let isDisabled = false;

      // Disable months before startMonth in startYear
      if (selectedYear === defaultStartYear && i < defaultStartMonth) {
        isDisabled = true;
      }

      // Disable future months
      if (
        selectedYear > now.getFullYear() ||
        (selectedYear === now.getFullYear() && i > now.getMonth())
      ) {
        isDisabled = true;
      }

      months.push({
        index: i,
        name: MONTHS[i],
        short: SHORT_MONTHS[i],
        disabled: isDisabled,
      });
    }

    return months;
  }, [selectedYear, defaultStartYear, defaultStartMonth, now]);

  // Check if a month is selected
  const isMonthSelected = (monthIndex: number) => {
    if (!value) return false;
    const parts = value.split(" ");
    const monthName = parts.slice(0, -1).join(" ");
    const year = parseInt(parts[parts.length - 1]);
    return MONTHS[monthIndex] === monthName && year === selectedYear;
  };

  // Handle month selection
  const handleMonthSelect = (monthIndex: number) => {
    const monthName = MONTHS[monthIndex];
    onChange?.(`${monthName} ${selectedYear}`);
    setOpen(false);
  };

  // Navigation
  const canGoPrevious = selectedYear > defaultStartYear;
  const canGoNext = selectedYear < now.getFullYear() + 1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between h-11 rounded-xl border-border bg-muted/40 hover:bg-muted dark:bg-background dark:hover:bg-muted/40 px-3",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value || "Select month and year"}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 squircle rounded-2xl"
        align="start"
        sideOffset={4}
      >
        {/* Year Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedYear((y) => y - 1)}
            disabled={!canGoPrevious}
          >
            <IconAltArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{selectedYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedYear((y) => y + 1)}
            disabled={!canGoNext}
          >
            <IconAltArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-4 gap-1 p-3">
          {availableMonths.map((month) => (
            <Button
              key={month.index}
              variant={isMonthSelected(month.index) ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-9 text-xs font-medium",
                isMonthSelected(month.index) && "shadow-sm",
                month.disabled && "opacity-40 cursor-not-allowed",
              )}
              disabled={month.disabled}
              onClick={() => handleMonthSelect(month.index)}
            >
              {month.short}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
