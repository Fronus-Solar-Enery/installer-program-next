import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import IconArrowUpDown from "../icons/ArrowUpDown";

export interface SearchableSelectOption {
  value: string;
  label: string | React.ReactNode;
}

export interface SearchableSelectGroup {
  label?: string;
  options: SearchableSelectOption[];
}

interface SearchableSelectProps {
  value?: string;
  id?: string;
  onValueChange: (value: string) => void;
  options?: SearchableSelectOption[];
  groups?: SearchableSelectGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  id,
  onValueChange,
  options = [],
  groups = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const allOptions = React.useMemo(() => {
    if (groups.length > 0) {
      return groups.flatMap((group) => group.options);
    }
    return options;
  }, [options, groups]);

  const selectedOption = allOptions.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          id={id}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-11 rounded-xl border-border bg-muted/40 hover:bg-muted dark:bg-background dark:hover:bg-muted/40 px-3",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="truncate flex-1 text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </div>
          <IconArrowUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 rounded-2xl"
        align="start"
        sideOffset={4}
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command className="w-full rounded-2xl dark:bg-background bg-card">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groups.length > 0 ? (
              groups.map((group) => (
                <CommandGroup
                  key={group.label}
                  heading={group.label}
                  className="[&>div]:space-y-1"
                >
                  {group.options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        onValueChange(
                          currentValue === value ? "" : currentValue
                        );
                        setOpen(false);
                      }}
                      className={cn(
                        "justify-between",
                        value === option.value && "bg-muted"
                      )}
                    >
                      {option.label}
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup className="[&>div]:space-y-1">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className={cn(
                      "justify-between",
                      value === option.value && "bg-muted"
                    )}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
