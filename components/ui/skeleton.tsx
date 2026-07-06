import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  round?: boolean;
}

function Skeleton({ className, round = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-primary/10",
        round && "rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
