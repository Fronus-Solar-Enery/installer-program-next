import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import IconMinus from "../icons/Minus";
import { IconCheck } from "../icons";

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate = false, checked, ...props }, ref) => {
  const checkboxRef = React.useRef<HTMLButtonElement>(null);

  // Combine Radix ref + local ref
  React.useImperativeHandle(
    ref,
    () => checkboxRef.current as HTMLButtonElement
  );

  // Sync indeterminate visual state
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.setAttribute(
        "data-state",
        indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"
      );
    }
  }, [indeterminate, checked]);

  return (
    <CheckboxPrimitive.Root
      ref={checkboxRef}
      checked={checked}
      className={cn(
        "cursor-pointer peer size-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground transition-colors",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {/* ✅ Conditional icons */}
        <IconCheck width={3} className="data-[state=indeterminate]:hidden" />
        <IconMinus className="hidden data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
