import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ReviewItemProps {
  label: string;
  value: string;
  valueClass?: string;
  icon?: ReactNode;
  isHighlighted?: boolean;
  fullWidth?: boolean;
}

export function ReviewItem({
  label,
  value,
  valueClass = "",
  icon,
  isHighlighted = false,
  fullWidth = false,
}: ReviewItemProps) {
  return (
    <div
      className={cn(
        "group w-full rounded-2xl bg-background p-3",
        fullWidth && "col-span-full"
      )}
    >
      <div className="flex items-end justify-between">
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          {label}
        </p>
        {icon && (
          <div className="p-2 flex items-center justify-center rounded-full">
            {icon}
          </div>
        )}
      </div>
      <p
        className={cn(
          "text-sm font-medium transition-colors group-hover:text-foreground/90",
          isHighlighted && "text-primary",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}
