"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HyperText } from "@/components/ui/hypertext";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/ui/loading";

interface InstallerCodeDisplayProps {
  code: string;
  isGenerating: boolean;
  isManualEdit: boolean;
  onCodeChange: (value: string) => void;
}

export function InstallerCodeDisplay({
  code,
  isGenerating,
  isManualEdit,
  onCodeChange,
}: InstallerCodeDisplayProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="installerCode" className="block">
        Installer Code
      </Label>
      {isManualEdit ? (
        <Input
          id="installerCode"
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="Enter installer code"
        />
      ) : (
        <div className="relative">
          <div className="h-11 border border-border rounded-xl bg-background flex items-center px-3">
            {isGenerating ? (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="uppercase text-xs font-bold tracking-wide">
                  Generating
                </div>
                <Loading className="size-4 mr-2" />
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <HyperText className="pointer-events-none">{code}</HyperText>
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
