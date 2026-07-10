"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import {
  Search,
  LayoutDashboard,
  Users,
  Gift,
  UserPlus,
  PackagePlus,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      title: "Dashboard",
      description: "View overall statistics and performance",
      icon: LayoutDashboard,
      href: "/dashboard",
      group: "Navigation",
    },
    {
      title: "Installers",
      description: "Manage installer registrations",
      icon: Users,
      href: "/installers",
      group: "Navigation",
    },
    {
      title: "Rewards",
      description: "Manage product installations and rewards",
      icon: Gift,
      href: "/rewards",
      group: "Navigation",
    },
    {
      title: "Add New Installer",
      description: "Register a new installer",
      icon: UserPlus,
      href: "/installers/register",
      group: "Actions",
    },
    {
      title: "Add New Reward",
      description: "Register a new product installation",
      icon: PackagePlus,
      href: "/rewards/register",
      group: "Actions",
    },
  ];

  const filteredCommands = commands.filter(
    (command) =>
      command.title.toLowerCase().includes(search.toLowerCase()) ||
      command.description.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }

      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(
            (prev) =>
              (prev - 1 + filteredCommands.length) % filteredCommands.length,
          );
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            router.push(selected.href);
            onOpenChange(false);
            setSearch("");
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onOpenChange(false);
          setSearch("");
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, filteredCommands, selectedIndex, onOpenChange, router]);

  const handleSelect = (command: CommandItem) => {
    router.push(command.href);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>
            Search for pages and actions. Use arrow keys to navigate and enter
            to select.
          </DialogDescription>
        </VisuallyHidden>
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-auto p-0"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.href}
                  onClick={() => handleSelect(command)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                    index === selectedIndex && "bg-accent",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <command.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{command.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {command.description}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/50 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono font-medium">
                ↑
              </kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono font-medium">
                ↓
              </kbd>
              <span className="ml-1">to navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono font-medium">
                Enter
              </kbd>
              <span className="ml-1">to select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono font-medium">
              Esc
            </kbd>
            <span className="ml-1">to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
