import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string | React.ReactNode;
  titleClassName?: string;
  description?: string | React.ReactNode;
  Icon?: React.ComponentType<IconProps>;
  action?: React.ReactNode;
  iconFill?: boolean;
}

export default function PageHeader({
  title,
  description,
  Icon,
  action,
  titleClassName,
  iconFill = false,
}: PageHeaderProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4 p-6 border lg:flex-nowrap bg-card squircle rounded-3xl border-border">
      <div className="flex items-center gap-4">
        {Icon && (
          <Icon
            className="hidden md:block w-12 h-12 text-primary shrink-0"
            fill={iconFill}
          />
        )}
        <div>
          <h1
            className={cn(
              "text-2xl font-medium tracking-wide text-foreground font-clash",
              titleClassName
            )}
          >
            {title}
          </h1>
          {description && (
            <div className="max-w-2xl mt-1 text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
      {action && (
        <div className="flex space-x-2 justify-end flex-shrink-0 w-full flex-wrap md:flex-nowrap md:w-auto md:block">
          {action}
        </div>
      )}
    </div>
  );
}
