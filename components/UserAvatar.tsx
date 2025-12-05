import { getInitials } from "@/lib/getInitials";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export const UserAvatar = ({
  user,
  size = "default",
  className,
}: {
  user: TeamUser | undefined;
  size?: "default" | "small";
  className?: string;
}) => {
  const sizeClasses = size === "small" ? "h-9 w-9" : "h-10 w-10";

  return (
    <div
      className={cn(
        "bg-card text-primary rounded-full flex items-center justify-center overflow-hidden border shadow-sm border-border select-none",
        sizeClasses,
        className
      )}
    >
      <span className="font-medium">
        {size === "small"
          ? user?.name?.charAt(0).toUpperCase() || "U"
          : getInitials(user?.name as string)}
      </span>
    </div>
  );
};

export const InstallerAvatar = ({
  user,
  size = "default",
  className,
}: {
  user: string | ReactNode;
  size?: "default" | "small";
  className?: string;
}) => {
  const sizeClasses = size === "small" ? "h-9 w-9" : "h-10 w-10";

  return (
    <div
      className={cn(
        "bg-card text-primary rounded-full flex items-center justify-center overflow-hidden border shadow-sm border-border select-none",
        sizeClasses,
        className
      )}
    >
      <span className="font-medium">
        {typeof user === "string" ? getInitials(user) : user || "U"}
      </span>
    </div>
  );
};
