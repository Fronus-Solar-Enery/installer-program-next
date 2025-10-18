import React from "react";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "./constants";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  disabled?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size = "xs",
      rounded = "xs",
      dot,
      icon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, rounded }),
          disabled &&
            "opacity-50 cursor-not-allowed pointer-events-none select-none",
          className
        )}
        {...props}
        role="button"
        aria-disabled={disabled}
      >
        {dot && (
          <span
            className={cn("mr-1.5 h-2 w-2 rounded-full ", getBgColor(variant))}
          />
        )}
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };

export const getBgColor = (variant: BadgeProps["variant"]) => {
  return typeof variant === "string" && variant.startsWith("outline-")
    ? "bg-foreground"
    : "bg-current";
};
