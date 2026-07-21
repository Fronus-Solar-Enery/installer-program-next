"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconAdd, IconClose, IconWarning2 } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FALSE_CLAIM_REASON } from "@/lib/constants";
import { DashboardCardHeader } from "../dashboard/page";

const MAX_REASONS = 20;
const MAX_LENGTH = 60;

interface RejectionReasonsCardProps {
  reasons: string[];
  saving: boolean;
  onSave: (next: string[]) => Promise<void> | void;
}

export function RejectionReasonsCard({
  reasons,
  saving,
  onSave,
}: RejectionReasonsCardProps) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const value = draft.trim();
    if (!value) return;
    if (value.length > MAX_LENGTH) {
      toast.error(`Reason must be ${MAX_LENGTH} characters or fewer`);
      return;
    }
    if (reasons.some((r) => r.toLowerCase() === value.toLowerCase())) {
      toast.error(`"${value}" already exists`);
      return;
    }
    if (reasons.length >= MAX_REASONS) {
      toast.error(`Limited to ${MAX_REASONS} reasons`);
      return;
    }
    setDraft("");
    onSave([...reasons, value]);
  };

  const handleRemove = (reason: string) => {
    // "False Claim" is the reason the warning system keys off — removing it
    // would silently stop warnings from ever being issued.
    if (reason === FALSE_CLAIM_REASON) return;
    onSave(reasons.filter((r) => r !== reason));
  };

  return (
    <Card>
      <DashboardCardHeader
        title="Rejection Reasons"
        description="Reasons offered when a product is marked rejected"
        Icon={IconWarning2}
        iconBadge={false}
      />
      <CardContent className="space-y-4 p-4!">
        <div className="flex flex-wrap gap-2">
          {reasons.map((reason) => {
            const locked = reason === FALSE_CLAIM_REASON;

            return (
              <span
                key={reason}
                className={
                  locked
                    ? "inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/5 py-1 pl-3 pr-3 text-sm font-medium"
                    : "inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1 text-sm font-medium"
                }
              >
                {reason}
                {locked ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="ml-1 cursor-help rounded-full text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        Required
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      This reason issues a warning against the installer and
                      cannot be removed.
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    aria-label={`Remove ${reason}`}
                    disabled={saving}
                    onClick={() => handleRemove(reason)}
                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive-text focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                  >
                    <IconClose className="size-3.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <label htmlFor="new-rejection-reason" className="sr-only">
            New rejection reason
          </label>
          <Input
            id="new-rejection-reason"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Serial Number Not Found"
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
