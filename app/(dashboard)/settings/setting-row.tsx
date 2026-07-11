import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { IconEdit2 } from "@/components/icons";

const ROW_CLASSES =
  "flex items-center justify-between gap-4 p-3.5 rounded-2xl squircle transition-colors duration-150 ease-fluid bg-muted/40 hover:bg-muted/50 cursor-pointer";

const VALUE_CLASSES =
  "text-xs bg-background border border-border px-2 py-1 rounded-xl squircle font-mono";

interface SwitchRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: SwitchRowProps) {
  const descriptionId = `${id}-description`;
  return (
    <label htmlFor={id} className={ROW_CLASSES}>
      <div className="flex-1 min-w-0">
        <Label htmlFor={id}>{label}</Label>
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={descriptionId}
      />
    </label>
  );
}

interface ValueRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

export function ValueRow({ label, value, onEdit }: ValueRowProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={`${ROW_CLASSES} w-full text-left`}
    >
      <span className="flex-1 min-w-0 text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2 shrink-0">
        <span className={VALUE_CLASSES}>{value}</span>
        <span className="shrink-0 p-3 bg-background rounded-xl">
          <IconEdit2 aria-hidden className="size-4 text-muted-foreground" />
        </span>
      </span>
      <span className="sr-only"> — tap to edit</span>
    </button>
  );
}
