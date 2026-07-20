"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { Settings } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { IconShare, IconLogout2 } from "@/components/icons";
import { cn } from "@/lib/utils";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((m) => m.ThemeToggle),
  { ssr: false },
);

interface HeaderMenuProps {
  onShare: () => void;
  onChangePin: () => void;
  onLogout: () => void;
}

const ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-4xl! px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring cursor-pointer nosquircle";

/**
 * Compact actions menu for the stats header — share, theme, PIN, sign out.
 *
 * Built on Radix Popover so focus handling, Escape and outside-click come for
 * free; `forceMount` hands open/close control to AnimatePresence so the panel
 * can spring in and out.
 */
export function HeaderMenu({
  onShare,
  onChangePin,
  onLogout,
}: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Every item closes the menu before acting, so the panel never lingers over
  // the dialog or navigation it triggers.
  const runAndClose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 32 };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={open ? "Close menu" : "Open menu"}
        className={cn(
          "flex size-9 items-center justify-center squircle rounded-full text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-ring cursor-pointer relative",
          open && "bg-secondary",
        )}
      >
        {/* Three bars that morph into a cross while the menu is open. */}
        <div className="relative size-4">
          {[
            { key: "top", closedY: -4, openRotate: 45, closedWidth: "1.1rem" },
            {
              key: "bottom",
              closedY: 4,
              openRotate: -45,
              closedWidth: "0.6rem",
            },
          ].map((bar) => (
            <motion.span
              key={bar.key}
              className={`absolute right-0 top-1/2 h-0.5 ${bar.closedWidth} -translate-y-1/2 rounded-full bg-current`}
              initial={false}
              animate={{
                y: open ? 0 : bar.closedY,
                rotate: open ? bar.openRotate : 0,
                opacity: open && bar.key === "middle" ? 0 : 1,
                width: open ? "1rem" : bar.closedWidth,
              }}
              transition={spring}
            />
          ))}
        </div>
      </PopoverTrigger>

      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal forceMount>
            <PopoverPrimitive.Content
              asChild
              align="end"
              sideOffset={10}
              className="z-100"
            >
              <motion.div
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.94, y: -8 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.96, y: -6 }
                }
                transition={spring}
                className="w-56 origin-top-right rounded-3xl border border-border bg-popover text-popover-foreground shadow-lg outline-none"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: { staggerChildren: reduceMotion ? 0 : 0.035 },
                    },
                  }}
                  className="flex flex-col gap-0.5"
                >
                  <div className="px-1.5 pt-1.5 pb-1">
                    {[
                      {
                        key: "share",
                        label: "Share profile",
                        icon: <IconShare className="size-4" />,
                        onClick: runAndClose(onShare),
                      },
                      {
                        key: "pin",
                        label: "Change PIN",
                        icon: <Settings className="size-4" />,
                        onClick: runAndClose(onChangePin),
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.key}
                        variants={{
                          hidden: reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, x: -6 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        transition={spring}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-auto justify-start hover:text-foreground",
                            ITEM_CLASS,
                          )}
                          onClick={item.onClick}
                        >
                          {item.icon}
                          {item.label}
                        </Button>
                      </motion.div>
                    ))}

                    <motion.div
                      variants={{
                        hidden: reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, x: -6 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      transition={spring}
                    >
                      <ThemeToggle
                        iconOnly={false}
                        iconClasses="size-4"
                        triggerClass={cn(
                          "h-auto justify-start hover:text-foreground",
                          ITEM_CLASS,
                        )}
                      />
                    </motion.div>
                  </div>
                  <div className="h-px bg-border" role="separator" />

                  <motion.div
                    variants={{
                      hidden: reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, x: -6 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={spring}
                    className="px-1.5 pt-1 pb-1.5"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-auto justify-start hover:text-foreground",
                        ITEM_CLASS,
                        "text-destructive-text hover:text-destructive-text-hover hover:bg-destructive/10",
                      )}
                      onClick={runAndClose(onLogout)}
                    >
                      <IconLogout2 className="size-4" />
                      Logout
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </Popover>
  );
}
