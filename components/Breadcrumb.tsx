"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import IconHomeAngle2 from "@/components/icons/HomeAngle2";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { BreadcrumbItem } from "@/contexts/BreadcrumbContext";
import { IconProps } from "./icons/Widget";

interface BreadcrumbProps {
  className?: string;
  // Items to display (required when not using context)
  items: BreadcrumbItem[];
  // Make home icon configurable
  homeIcon?: React.FC<IconProps>;
  // Option to hide the home icon
  showHome?: boolean;
  // Max breadcrumbs to show before truncating
  maxItems?: number;
  // Whether to show a tooltip for truncated items
  showTooltips?: boolean;
  // Default icon class name
  iconClassName?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  className,
  items,
  homeIcon = IconHomeAngle2,
  showHome = true,
  maxItems = 4,
  showTooltips = true,
}) => {
  const breadcrumbItems = useMemo(() => {
    let processedItems = items;

    // Filter out home item if not showing
    if (!showHome) {
      processedItems = processedItems.filter((item) => item.href !== "/");
    }

    // Add home icon to first item if it's the home item
    if (processedItems.length > 0 && processedItems[0].href === "/") {
      processedItems = [
        { ...processedItems[0], icon: homeIcon },
        ...processedItems.slice(1),
      ];
    }

    return processedItems;
  }, [items, showHome, homeIcon]);

  // Handle truncation for long breadcrumbs
  const visibleItems = useMemo(() => {
    if (breadcrumbItems.length <= maxItems) return breadcrumbItems;

    // Show first, ellipsis, and last few items
    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-Math.min(maxItems - 1, 2));
    return [firstItem, { label: "...", href: undefined }, ...lastItems];
  }, [breadcrumbItems, maxItems]);

  // Render the optimized breadcrumb
  return (
    <nav
      className={cn("flex items-center flex-wrap gap-1", className)}
      aria-label="Breadcrumb"
    >
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;
        const isEllipsis = item.label === "...";
        const hiddenItems = isEllipsis
          ? breadcrumbItems.slice(1, -Math.min(maxItems - 1, 2))
          : [];

        // Create icon element if icon component is provided
        const iconElement = item.icon && (
          <item.icon className={cn("w-4.5 h-4.5")} fill={!isLast} />
        );

        return (
          <React.Fragment key={`${item.href}-${index}`}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
            )}

            {isEllipsis && showTooltips ? (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-default select-none">
                      ...
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="p-2">
                    <div className="flex flex-col gap-1">
                      {hiddenItems.map((hidden, i) => (
                        <span key={i} className="whitespace-nowrap text-xs">
                          {hidden.label}
                        </span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : isEllipsis ? (
              <span className="text-sm text-muted-foreground">...</span>
            ) : isLast ? (
              <span className="text-sm font-medium text-foreground flex items-center">
                {iconElement && <span className="mr-1.5">{iconElement}</span>}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || "#"}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
              >
                {iconElement && <span className="mr-1.5">{iconElement}</span>}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default React.memo(Breadcrumb);
