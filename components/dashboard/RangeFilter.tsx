"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  TIME_PERIOD_LABELS,
  TIME_PERIOD_TOGGLES,
  type TimePeriod,
} from "@/hooks/useDashboardData";
import IconClockCircle from "@/components/icons/ClockCircle";
import IconRefresh2 from "@/components/icons/Refresh2";

/**
 * The dashboard's one filter row.
 *
 * Deliberately a single control set above everything it scopes — per-card date
 * pickers would let two charts on the same screen describe two different
 * periods, which is how a dashboard starts lying.
 */
export function RangeFilter({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomChange,
  onRefresh,
  busy,
}: {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomChange: (start: string, end: string) => void;
  onRefresh: () => void;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(customStartDate);
  const [draftEnd, setDraftEnd] = useState(customEndDate);

  return (
    <div className="flex w-full items-center gap-2 md:w-auto">
      <div className="min-w-0 flex-1 overflow-x-auto md:flex-none">
      <ToggleGroup
        type="single"
        value={period}
        disabled={busy}
        onValueChange={(value) => value && onPeriodChange(value as TimePeriod)}
        aria-label="Date range"
        className="h-10"
      >
        {TIME_PERIOD_TOGGLES.map(({ value, short }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className="h-8"
            aria-label={TIME_PERIOD_LABELS[value]}
          >
            {short}
          </ToggleGroupItem>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              aria-label="Custom date range"
              className={cn(
                "h-8 gap-2 rounded-xl px-2",
                period === "custom"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <IconClockCircle className="size-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Custom date range</h4>
                <p className="text-xs text-muted-foreground">
                  Scopes every figure and chart on this page.
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="range-start" className="text-xs">
                    Start date
                  </Label>
                  <Input
                    id="range-start"
                    type="date"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    max={draftEnd || new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="range-end" className="text-xs">
                    End date
                  </Label>
                  <Input
                    id="range-end"
                    type="date"
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    min={draftStart || undefined}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!draftStart || !draftEnd}
                  onClick={() => {
                    onCustomChange(draftStart, draftEnd);
                    onPeriodChange("custom");
                    setOpen(false);
                  }}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraftStart("");
                    setDraftEnd("");
                    onCustomChange("", "");
                    onPeriodChange("all");
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </ToggleGroup>
      </div>

      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={busy}
        className="gap-2"
      >
        <span className="hidden sm:inline">Refresh</span>
        <IconRefresh2
          width={2}
          className={cn("size-3.5", busy && "animate-spin")}
        />
      </Button>
    </div>
  );
}
