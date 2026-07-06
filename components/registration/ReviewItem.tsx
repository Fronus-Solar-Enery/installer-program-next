import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ReviewItemProps {
  label: string;
  value: string;
  valueClass?: string;
  icon?: ReactNode;
  isHighlighted?: boolean;
  fullWidth?: boolean;
  /** Size variant for the value text */
  size?: "sm" | "md";
}

export function ReviewItem({
  label,
  value,
  valueClass = "",
  icon,
  isHighlighted = false,
  fullWidth = false,
  size = "md",
}: ReviewItemProps) {
  return (
    <div
      className={cn(
        "group w-full rounded-2xl bg-background p-3",
        fullWidth && "col-span-full"
      )}
    >
      <div
        className={cn(
          "flex justify-between",
          size === "sm" ? "items-end" : "items-center"
        )}
      >
        <p
          className={cn(
            "text-xs font-medium text-muted-foreground flex items-center gap-1.5",
            size === "sm" && "mb-2"
          )}
        >
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
          "font-medium transition-colors group-hover:text-foreground/90",
          size === "sm" ? "text-sm" : "text-base",
          isHighlighted && "text-primary",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}
