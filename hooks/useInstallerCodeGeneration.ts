import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { TRAINING_CENTER } from "@/lib/constants";

interface InstallerResponse {
  _id: string;
  cnic?: string;
  installerCode?: string;
  fullName?: string;
}

export function useInstallerCodeGeneration(
  trainingCenter: string,
  allowManualEdit: boolean
) {
  const [installerCode, setInstallerCode] = useState("");
  const [codeGenerating, setCodeGenerating] = useState(false);

  const generateInstallerCode = useCallback(async () => {
    const center = TRAINING_CENTER.find((tc) => tc.city === trainingCenter);
    if (!center) return;

    setCodeGenerating(true);
    try {
      const randomPart = Array.from({ length: 8 }, () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }).join("");

      const proposedCode = `${center.short}${randomPart}`;

      const response = await fetch(`/api/installers?search=${proposedCode}`);
      const data = await response.json();

      if (data.success && data.data.installers.length > 0) {
        const exists = data.data.installers.find(
          (i: InstallerResponse) => i.installerCode === proposedCode
        );
        if (exists) {
          setTimeout(() => generateInstallerCode(), 100);
          return;
        }
      }

      setInstallerCode(proposedCode);
      toast.success("Installer code generated");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate installer code");
    } finally {
      setCodeGenerating(false);
    }
  }, [trainingCenter]);

  useEffect(() => {
    if (trainingCenter && !allowManualEdit) {
      generateInstallerCode();
    }
  }, [trainingCenter, allowManualEdit, generateInstallerCode]);

  const handleInstallerCodeChange = (value: string) => {
    setInstallerCode(value.toUpperCase());
  };

  return {
    installerCode,
    codeGenerating,
    handleInstallerCodeChange,
  };
}
