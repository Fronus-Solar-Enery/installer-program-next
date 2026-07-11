import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import type { ProductInput, ProductWithId } from "@/hooks/useProducts";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: ProductInput) => void;
  product: ProductWithId | null;
  isSaving?: boolean;
}

const EMPTY_FORM: ProductInput = {
  name: "",
  reward: 0,
  requiresInverter: false,
  isBattery: false,
};

export function ProductFormDialog({
  isOpen,
  onClose,
  onSave,
  product,
  isSaving = false,
}: ProductFormDialogProps) {
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);

  useEffect(() => {
    setForm(
      product
        ? {
            name: product.name,
            reward: product.reward,
            requiresInverter: product.requiresInverter,
            isBattery: product.isBattery,
          }
        : EMPTY_FORM,
    );
  }, [product, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            Set the product name and its installer reward amount (Rs.)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-reward">Reward Amount (Rs.)</Label>
            <Input
              id="product-reward"
              type="number"
              value={form.reward}
              onChange={(e) =>
                setForm((f) => ({ ...f, reward: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="product-battery">Is Battery</Label>
            <Switch
              label="Is Battery"
              checked={form.isBattery}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, isBattery: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="product-inverter">Requires Inverter Serial</Label>
            <Switch
              label="Requires Inverter Serial"
              checked={form.requiresInverter}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, requiresInverter: checked }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.name.trim()}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
