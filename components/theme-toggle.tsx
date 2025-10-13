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

// Types
type Theme = "light" | "dark" | "system";

// Get icon for current theme
const getThemeIcon = (theme: string | undefined) => {
  switch (theme) {
    case "dark":
      return <IconMoon className="w-5 h-5" duotone={false} />;
    case "light":
      return <IconSun2 className="w-5 h-5" duotone={false} />;
    case "system":
    default:
      return <IconNotebookMinimalistic className="w-5 h-5" duotone={false} />;
  }
};

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

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Get current theme icon
  const currentIcon = React.useMemo(() => getThemeIcon(theme), [theme]);

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl">
          {currentIcon}
        </Button>
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
  onSelect: (theme: string) => void;
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
        isActive && "font-medium text-primary bg-secondary"
      )}
    >
      <Icon className="w-4 h-4 mr-2" duotone={false} />
      {label}
    </Button>
  );
}

export default React.memo(ThemeToggle);
