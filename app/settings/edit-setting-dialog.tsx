import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface EditSettingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string | number) => void;
  title: string;
  description?: string;
  currentValue: string | number;
  type?: "text" | "number" | "email" | "textarea";
}

export function EditSettingDialog({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  currentValue,
  type = "text",
}: EditSettingDialogProps) {
  const [value, setValue] = useState<string | number>(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, isOpen]);

  const handleSave = () => {
    if (type === "number") {
      onSave(Number(value));
    } else {
      onSave(value);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="setting-value">Value</Label>
            {type === "textarea" ? (
              <Textarea
                id="setting-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
              />
            ) : (
              <Input
                id="setting-value"
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
