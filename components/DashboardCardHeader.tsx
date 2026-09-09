import type { FC, ReactNode } from "react";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardCardHeaderProps {
  title: string;
  description: string;
  Icon: FC<IconProps>;
  badge?: string;
  iconBadge?: boolean;
  actions?: ReactNode;
}

/**
 * Card header used by the settings pages.
 *
 * Previously exported from `app/(dashboard)/dashboard/page.tsx`, which meant
 * settings imported a component out of a route module. It lives here now so the
 * dashboard page can change shape without dragging settings with it.
 */
export const DashboardCardHeader: FC<DashboardCardHeaderProps> = ({
  title,
  description,
  Icon,
  badge,
  iconBadge = true,
  actions,
}) => {
  return (
    <CardHeader className="flex flex-row items-center gap-2 border-b border-border md:text-left">
      <div className="mb-0 flex flex-1 items-center gap-4">
        <div className="hidden md:block">
          {Icon && <Icon className="mb-0 h-12 w-12 text-primary" fill duotone />}
        </div>
        <div>
          <CardTitle className="flex items-center text-xl font-normal md:justify-start">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      {actions}
      {badge ? (
        <Badge className="hidden md:block" variant="outline">
          {badge}
        </Badge>
      ) : (
        iconBadge && (
          <div className="squircle hidden rounded-xl bg-emerald-100 p-2 md:block dark:bg-emerald-950">
            <Icon
              fill
              className="size-5 text-emerald-600 dark:text-emerald-400"
            />
          </div>
        )
      )}
    </CardHeader>
  );
};

export default DashboardCardHeader;
