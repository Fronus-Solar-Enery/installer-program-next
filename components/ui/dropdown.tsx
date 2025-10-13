"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/outsideClick";

// Context for dropdown state
interface DropdownContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

const useDropdownContext = () => {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown");
  }
  return context;
};

// Main Dropdown Component
interface DropdownProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnClickOutside?: boolean;
}

export function Dropdown({
  children,
  defaultOpen = false,
  onOpenChange,
  closeOnClickOutside = true,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const open = React.useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const close = React.useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const toggle = React.useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Close on click outside
  useClickOutside(dropdownRef, () => {
    if (isOpen && closeOnClickOutside) {
      close();
    }
  });

  const contextValue = React.useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle]
  );

  return (
    <DropdownContext.Provider value={contextValue}>
      <div ref={dropdownRef} className="relative">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// Dropdown Trigger Component
interface DropdownTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
  activeClassName?: string;
}

export function DropdownTrigger({
  children,
  asChild = false,
  className,
  activeClassName = "bg-accent",
}: DropdownTriggerProps) {
  const { toggle, isOpen } = useDropdownContext();

  if (asChild && React.isValidElement(children)) {
    // Clone the child element and add onClick handler
    const childProps = children.props as {
      onClick?: React.MouseEventHandler<HTMLElement>;
      className?: string;
    };
    const originalOnClick = childProps.onClick;
    const originalClassName = childProps.className || "";

    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        originalOnClick?.(e);
        toggle();
      },
      className: cn(originalClassName, isOpen && activeClassName),
      "aria-expanded": isOpen,
      "aria-haspopup": "menu",
    } as Record<string, unknown>);
  }

  return (
    <div
      onClick={toggle}
      className={cn(className, isOpen && activeClassName)}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      {children}
    </div>
  );
}

// Dropdown Content Component
interface DropdownContentProps {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
  animationDuration?: number;
  sideOffset?: number;
}

export function DropdownContent({
  children,
  align = "right",
  width = "w-auto",
  className,
  animationDuration = 0.1,
  sideOffset = 4,
}: DropdownContentProps) {
  const { isOpen } = useDropdownContext();

  const alignmentStyles = React.useMemo(() => {
    switch (align) {
      case "left":
        return "left-0";
      case "center":
        return "left-1/2 -translate-x-1/2";
      case "right":
      default:
        return "right-0";
    }
  }, [align]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: animationDuration }}
          className={cn(
            "absolute top-full bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden border-border",
            width,
            alignmentStyles,
            className
          )}
          style={{ marginTop: `${sideOffset}px` }}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Optional: Helper hook to use dropdown state in custom components
export function useDropdown() {
  return useDropdownContext();
}

// Export compound component
Dropdown.Trigger = DropdownTrigger;
Dropdown.Content = DropdownContent;

export default Dropdown;

// USAGE EXAMPLE
/*
<Dropdown>
  <DropdownTrigger>
    <Button variant="outline">
      Open Menu
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </DropdownTrigger>
  <DropdownContent className="w-48">
    <div className="p-2 space-y-1">
      <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg">
        Profile
      </button>
      <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg">
        Settings
      </button>
      <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg text-destructive">
        Logout
      </button>
    </div>
  </DropdownContent>
</Dropdown>
*/
