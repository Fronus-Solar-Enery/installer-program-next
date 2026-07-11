"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconAdd, IconCard, IconClose } from "@/components/icons";
import { DashboardCardHeader } from "../dashboard/page";

const MAX_METHODS = 20;
const MAX_LENGTH = 40;

interface PaymentMethodsCardProps {
  methods: string[];
  saving: boolean;
  onSave: (next: string[]) => Promise<void> | void;
}

export function PaymentMethodsCard({
  methods,
  saving,
  onSave,
}: PaymentMethodsCardProps) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const value = draft.trim();
    if (!value) return;
    if (value.length > MAX_LENGTH) {
      toast.error(`Payment method must be ${MAX_LENGTH} characters or fewer`);
      return;
    }
    if (methods.some((m) => m.toLowerCase() === value.toLowerCase())) {
      toast.error(`"${value}" already exists`);
      return;
    }
    if (methods.length >= MAX_METHODS) {
      toast.error(`Limited to ${MAX_METHODS} payment methods`);
      return;
    }
    setDraft("");
    onSave([...methods, value]);
  };

  const handleRemove = (method: string) => {
    if (methods.length <= 1) {
      toast.error("At least one payment method is required");
      return;
    }
    onSave(methods.filter((m) => m !== method));
  };

  return (
    <Card>
      <DashboardCardHeader
        title="Payment Methods"
        description="Options offered when recording reward payments"
        Icon={IconCard}
        iconBadge={false}
      />
      <CardContent className="space-y-4 p-4!">
        <div className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <span
              key={method}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1 text-sm font-medium"
            >
              {method}
              <button
                type="button"
                aria-label={`Remove ${method}`}
                disabled={saving}
                onClick={() => handleRemove(method)}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive-text focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <IconClose className="size-3.5" />
              </button>
            </span>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <label htmlFor="new-payment-method" className="sr-only">
            New payment method
          </label>
          <Input
            id="new-payment-method"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. JazzCash"
            maxLength={MAX_LENGTH}
            disabled={saving}
          />
          <Button
            type="submit"
            variant="outline"
            className="shrink-0 gap-1"
            disabled={saving || !draft.trim()}
          >
            <IconAdd className="size-3.5!" />
            {saving ? "Saving..." : "Add"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
