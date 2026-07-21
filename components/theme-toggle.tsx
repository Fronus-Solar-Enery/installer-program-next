"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  useDropdown,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import IconNotebookMinimalistic from "./icons/NotebookMinimalistic";
import IconMoon from "./icons/Moon";
import IconSun2 from "./icons/Sun2";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

// Theme options
const THEME_OPTIONS = [
  {
    value: "light" as const,
    label: "Light",
    Icon: IconSun2,
  },
  {
    value: "dark" as const,
    label: "Dark",
    Icon: IconMoon,
  },
  {
    value: "system" as const,
    label: "System",
    Icon: IconNotebookMinimalistic,
  },
];

interface ThemeToggleProps {
  iconClasses?: string;
  triggerClass?: string;
  iconOnly?: boolean;
  children?: React.ReactNode;
}

export function ThemeToggle({
  triggerClass,
  iconClasses,
  iconOnly = true,
  children,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const currentOption =
    THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2];
  const CurrentIcon = currentOption.Icon;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        {children ?? (
          <Button
            variant="ghost"
            size={iconOnly ? "icon" : "default"}
            className={
              triggerClass ?? "hover:border border-border rounded-full"
            }
          >
            <CurrentIcon className={cn("w-5 h-5", iconClasses)} />
            {!iconOnly && currentOption.label}
          </Button>
        )}
      </DropdownTrigger>
      <DropdownContent align="right" className="w-28">
        <div className="p-2 flex flex-col gap-1">
          {THEME_OPTIONS.map((themeOption) => {
            const isActive = theme === themeOption.value;
            const { Icon } = themeOption;

            return (
              <ThemeOption
                key={themeOption.value}
                value={themeOption.value}
                label={themeOption.label}
                Icon={Icon}
                isActive={isActive}
                onSelect={setTheme}
              />
            );
          })}
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

// Theme option component using useDropdown hook
interface ThemeOptionProps {
  value: Theme;
  label: string;
  Icon: React.ComponentType<{ className?: string; duotone?: boolean }>;
  isActive: boolean;
  onSelect: (theme: Theme) => void;
}

function ThemeOption({
  value,
  label,
  Icon,
  isActive,
  onSelect,
}: ThemeOptionProps) {
  const { close } = useDropdown();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        onSelect(value);
        close();
      }}
      className={cn(
        "w-full justify-start px-2 py-2 text-sm bg-transparent rounded-lg flex items-center",
        isActive && "font-medium text-primary bg-secondary",
      )}
    >
      <Icon className="mr-2" />
      {label}
    </Button>
  );
}

export default React.memo(ThemeToggle);
