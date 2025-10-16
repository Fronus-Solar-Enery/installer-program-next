import React from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Skeleton } from "./ui/skeleton";
import { TableCell, TableRow } from "./ui/table";
import { Eye, Edit, Trash2 } from "lucide-react";
import type { FC } from "react";
import type { IconProps } from "./icons/Widget";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  tableSelector?: string; // selector for your actual table
  headerSelector?: string; // selector for header cells, defaults to `${tableSelector} thead th`
  actionIcons?: FC<IconProps>[]; // icons for actions column
  excludeLastColumn?: boolean; // if true, treat the last header column as reserved for actions
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 10,
  tableSelector = "table",
  headerSelector,
  actionIcons = [
    Eye as FC<IconProps>,
    Edit as FC<IconProps>,
    Trash2 as FC<IconProps>,
  ],
  excludeLastColumn = false,
}) => {
  const [colWidths, setColWidths] = React.useState<string[]>([]);

  React.useEffect(() => {
    const measure = () => {
      const headerSel = headerSelector ?? `${tableSelector} thead th`;
      const ths = Array.from(
        document.querySelectorAll(headerSel)
      ) as HTMLElement[];
      if (!ths.length) return;

      const widths = ths.map(
        (th) => `${Math.round(th.getBoundingClientRect().width)}px`
      );
      setColWidths(widths);
    };

    measure();
    const ro = new ResizeObserver(measure);
    const table = document.querySelector(tableSelector);
    if (table) ro.observe(table);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [tableSelector, headerSelector]);

  const fallbackWidths = React.useMemo(
    () => [
      "48px",
      "120px",
      "200px",
      "160px",
      "120px",
      "120px",
      "100px",
      "70px",
      "160px",
    ],
    []
  );

  const widths = colWidths.length ? colWidths : fallbackWidths;

  // determine index to reserve for actions
  const reservedIndex = excludeLastColumn
    ? Math.max(0, widths.length - 1)
    : undefined;
  const actionsWidth =
    reservedIndex !== undefined
      ? widths[reservedIndex]
      : widths[widths.length - 1];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx} className="animate-pulse">
          {/* render one cell per header, skipping the reserved actions header if requested */}
          {widths.map((w, i) => {
            if (i === reservedIndex) return null; // skip reserved actions header
            return (
              <TableCell
                className={cn(i === 0 && "w-12 text-center")}
                key={i}
                style={{ width: i === 0 ? 0 : w }}
              >
                {i === 0 ? (
                  <Checkbox disabled />
                ) : (
                  <Skeleton className="h-5 w-full rounded" />
                )}
              </TableCell>
            );
          })}

          {/* render actions cell using the reserved width (or last width) */}
          <TableCell style={{ width: actionsWidth }}>
            <div className="flex items-center gap-2">
              {actionIcons.map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" disabled>
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

// Usage example:
// <TableSkeleton rows={10} actionIcons={[Eye, Edit, Trash2]} excludeLastColumn tableSelector="#installers-table" />
