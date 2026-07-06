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

interface BreadcrumbProps {
  className?: string;
  items: BreadcrumbItem[];
  homeIcon?: React.FC<IconProps>;
  showHome?: boolean;
  maxItems?: number;
  showTooltips?: boolean;
  iconClassName?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  className,
  items,
  homeIcon = IconHomeAngle2,
  showHome = true,
  maxItems = 4,
  showTooltips = true,
  iconClassName,
}) => {
  const breadcrumbItems = useMemo(() => {
    const HOME_HREFS = new Set(["/", "/dashboard"]);
    let processedItems = items.slice();

    // Filter out home item if not showing
    if (!showHome) {
      processedItems = processedItems.filter(
        (item) => !HOME_HREFS.has(item.href ?? "")
      );
    }

    // If first item is a home path, ensure it uses the supplied homeIcon
    if (
      processedItems.length > 0 &&
      HOME_HREFS.has(processedItems[0].href ?? "")
    ) {
      processedItems = [
        {
          ...processedItems[0],
          icon: homeIcon as unknown as React.FC<IconProps>,
        },
        ...processedItems.slice(1),
      ];
    }

    return processedItems;
  }, [items, showHome, homeIcon]);

  const visibleItems = useMemo(() => {
    if (breadcrumbItems.length <= maxItems) return breadcrumbItems;

    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-Math.min(maxItems - 1, 2));
    return [firstItem, { label: "...", href: undefined }, ...lastItems];
  }, [breadcrumbItems, maxItems]);

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

        // Render icon component safely
        const IconComp = item.icon as React.FC<IconProps> | undefined;
        const iconElement = IconComp ? (
          <IconComp fill={!isLast} duotone />
        ) : null;

        return (
          <React.Fragment key={`${item.href ?? "-"}-${index}`}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
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
                        <span
                          key={i}
                          className="whitespace-nowrap text-xs leading-none"
                        >
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
              <span className="text-sm font-medium text-foreground flex items-center leading-none">
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
