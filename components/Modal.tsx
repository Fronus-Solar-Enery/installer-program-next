"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ReactNode, RefObject } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
  ref?: RefObject<HTMLDivElement | null>;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  ref,
  size = "lg",
}: ModalProps) {
  const sizeClasses = {
    sm: "sm:max-w-[425px]",
    md: "sm:max-w-[600px]",
    lg: "sm:max-w-[800px]",
    xl: "sm:max-w-[1000px]",
    full: "sm:max-w-[1200px]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <VisuallyHidden>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
      </VisuallyHidden>
      <DialogContent
        ref={ref}
        aria-describedby={description}
        className={cn(
          sizeClasses[size],
          "p-0 flex flex-col max-h-[90vh] squircle rounded-3xl overflow-hidden light:border-primary/20"
        )}
        hideClose
      >
        <div
          className={cn(
            "overflow-y-auto overflow-x-hidden flex-1 px-6 py-6",
            className
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
