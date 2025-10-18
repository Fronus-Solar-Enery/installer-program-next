"use client";

import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HyperText } from "@/components/ui/hypertext";

interface CNICInputProps {
  value: string;
  onChange: (value: string) => void;
  isValidating: boolean;
  isChecked: boolean;
  error: string;
  cnicLength: number;
}

export function CNICInput({
  value,
  onChange,
  isValidating,
  isChecked,
  error,
  cnicLength,
}: CNICInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="cnic" className="block">
        CNIC <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          id="cnic"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="35202-1234567-8"
          className={`pr-10 ${error ? "border-destructive" : ""}`}
        />
        {isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isValidating && isChecked && cnicLength === 13 && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <HyperText className="tracking-widest text-xs uppercase text-success-text pointer-events-none select-none">
              Valid
            </HyperText>
          </div>
        )}
        {!isValidating && error && cnicLength === 13 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <HyperText className="tracking-widest text-xs uppercase text-destructive-text pointer-events-none select-none">
              Invalid
            </HyperText>
          </div>
        )}
      </div>
      {error && !isValidating && (
        <p className="text-sm text-destructive-text">{error}</p>
      )}
    </div>
  );
}
