"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HyperText } from "@/components/ui/hypertext";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/ui/loading";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconInstallerCode } from "@/components/icons";

interface InstallerCodeDisplayProps {
  code: string;
  isGenerating: boolean;
  isManualEdit: boolean;
  onCodeChange: (value: string) => void;
  isValidating?: boolean;
  error?: string | null;
  isValid?: boolean;
}

export function InstallerCodeDisplay({
  code,
  isGenerating,
  isManualEdit,
  onCodeChange,
  isValidating = false,
  error = null,
  isValid = false,
}: InstallerCodeDisplayProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="installerCode" className="block">
        Installer Code <span className="text-destructive">*</span>
      </Label>
      {isManualEdit ? (
        <>
          <div className="relative">
            <Input
              id="installerCode"
              type="text"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="Enter installer code (10 characters)"
              maxLength={10}
              className={cn(
                error && "border-destructive focus-visible:ring-destructive",
                isValid &&
                  "border-success-border focus-visible:ring-success-border",
              )}
            />
            {isValidating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loading />
              </div>
            )}
            {!isValidating && isValid && code && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle className="h-4 w-4 text-success-text" />
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isValid && !error && code && (
            <p className="text-sm text-success-text">
              Installer code is available
            </p>
          )}
        </>
      ) : (
        <div className="relative">
          <div className="h-11 border border-border rounded-xl bg-background flex items-center px-3">
            {isGenerating ? (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="uppercase text-xs font-bold tracking-wide">
                  Generating
                </div>
                <Loading className="mr-2" />
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <IconInstallerCode className="text-muted-foreground" />
                </div>
                <HyperText className="pointer-events-none ml-6 [&>*]:leading-none">
                  {code}
                </HyperText>
                <Badge
                  variant="success"
                  className="!text-[8px] !tracking-widest font-bold rounded-sm"
                >
                  AUTO-GENERATED
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
