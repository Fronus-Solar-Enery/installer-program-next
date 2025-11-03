import { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  opacity?: string;
  fill?: boolean;
  duotone?: boolean;
}

interface ReviewSectionHeaderProps {
  title: string;
  className?: string;
  icon: FC<IconProps>;
  badge?: ReactNode;
}

export const ReviewSectionHeader: FC<ReviewSectionHeaderProps> = ({
  title,
  icon: Icon,
  badge,
  className,
}) => (
  <div
    className={cn(
      "flex items-center justify-between border-b border-border/30 pb-6",
      className
    )}
  >
    <div className="flex items-center gap-3">
      <div className="dark:bg-background bg-muted p-2.5 rounded-xl">
        <Icon fill className="h-5 w-5 text-primary" opacity="0.3" duotone />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
    </div>
    {badge}
  </div>
);
