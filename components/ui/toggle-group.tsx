"use client";

import { getStrictContext } from "@/contexts/StrictContext";
import { VariantProps } from "class-variance-authority";
import { toggleVariants } from "./toggle";

import {
  ToggleGroup as ToggleGroupPrimitive,
  ToggleGroupItem as ToggleGroupItemPrimitive,
  ToggleGroupHighlight as ToggleGroupHighlightPrimitive,
  ToggleGroupHighlightItem as ToggleGroupHighlightItemPrimitive,
  useToggleGroup as useToggleGroupPrimitive,
  type ToggleGroupProps as ToggleGroupPrimitiveProps,
  type ToggleGroupItemProps as ToggleGroupItemPrimitiveProps,
} from "./toggle-group-premitive";

import { cn } from "@/lib/utils";

const [ToggleGroupProvider, useToggleGroup] =
  getStrictContext<VariantProps<typeof toggleVariants>>("ToggleGroupContext");

type ToggleGroupProps = ToggleGroupPrimitiveProps &
  VariantProps<typeof toggleVariants>;

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group border border-border p-1 flex gap-0.5 w-fit items-center rounded-xl data-[variant=outline]:shadow-xs data-[variant=outline]:border data-[variant=outline]:p-0.5",
        className
      )}
      {...props}
    >
      <ToggleGroupProvider value={{ variant, size }}>
        {props.type === "single" ? (
          <ToggleGroupHighlightPrimitive className="bg-accent rounded-lg">
            {children}
          </ToggleGroupHighlightPrimitive>
        ) : (
          children
        )}
      </ToggleGroupProvider>
    </ToggleGroupPrimitive>
  );
}

type ToggleGroupItemProps = ToggleGroupItemPrimitiveProps &
  VariantProps<typeof toggleVariants>;

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: ToggleGroupItemProps) {
  const { variant: contextVariant, size: contextSize } = useToggleGroup();
  const { type } = useToggleGroupPrimitive();

  return (
    <ToggleGroupHighlightItemPrimitive
      value={props.value}
      className={cn(type === "multiple" && "bg-accent rounded-md")}
    >
      <ToggleGroupItemPrimitive
        data-slot="toggle-group-item"
        data-variant={contextVariant || variant}
        data-size={contextSize || size}
        className={cn(
          toggleVariants({
            variant: contextVariant || variant,
            size: contextSize || size,
          }),
          "min-w-0 flex-1 shrink-0 data-[state=on]:bg-zinc-300 dark:data-[state=on]:bg-muted rounded-xl shadow-none focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l text-xs text-zinc-500 dark:text-zinc-400 leading-none px-2.5",
          className
        )}
        {...props}
      >
        {children}
      </ToggleGroupItemPrimitive>
    </ToggleGroupHighlightItemPrimitive>
  );
}

export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
  type ToggleGroupItemProps,
};
