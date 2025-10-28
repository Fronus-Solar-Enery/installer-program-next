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
  allowManualEdit: boolean,
  excludeCode?: string
) {
  const [installerCode, setInstallerCode] = useState("");
  const [codeGenerating, setCodeGenerating] = useState(false);
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeValid, setCodeValid] = useState(false);

  const generateInstallerCode = useCallback(async () => {
    const center = TRAINING_CENTER.find((tc) => tc.city === trainingCenter);
    if (!center) return;

    setCodeGenerating(true);
    setCodeError(null);
    try {
      // Generate 7 random characters to make total of 10 (3 prefix + 7 random)
      const randomPart = Array.from({ length: 7 }, () => {
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
      setCodeValid(true);
      toast.success("Installer code generated");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate installer code");
      setCodeError("Failed to generate code");
    } finally {
      setCodeGenerating(false);
    }
  }, [trainingCenter]);

  const validateManualCode = useCallback(
    async (code: string) => {
      if (!code || code.length < 3) {
        setCodeError(null);
        setCodeValid(false);
        return;
      }

      // Skip validation if code matches the excluded one (original code in edit mode)
      if (excludeCode && code.toUpperCase() === excludeCode.toUpperCase()) {
        setCodeValid(true);
        setCodeError(null);
        return;
      }

      const center = TRAINING_CENTER.find((tc) => tc.city === trainingCenter);
      if (!center) {
        setCodeError("Training center not selected");
        setCodeValid(false);
        return;
      }

      // Check if code starts with correct training center prefix
      const prefix = code.substring(0, 3).toUpperCase();
      if (prefix !== center.short) {
        setCodeError(
          `Code must start with ${center.short} for ${trainingCenter}`
        );
        setCodeValid(false);
        return;
      }

      // Check if code length is exactly 10 characters
      if (code.length !== 10) {
        setCodeError("Code must be exactly 10 characters");
        setCodeValid(false);
        return;
      }

      // Check if code contains only alphanumeric characters (letters, numbers, or mix)
      const alphanumericRegex = /^[A-Z0-9]+$/;
      if (!alphanumericRegex.test(code)) {
        setCodeError("Code must contain only uppercase letters and/or numbers");
        setCodeValid(false);
        return;
      }

      // Check if code already exists
      setCodeValidating(true);
      setCodeError(null);
      try {
        const response = await fetch(`/api/installers?search=${code}`);
        const data = await response.json();

        if (data.success && data.data.installers.length > 0) {
          const exists = data.data.installers.find(
            (i: InstallerResponse) =>
              i.installerCode?.toUpperCase() === code.toUpperCase()
          );
          if (exists) {
            setCodeError("This installer code already exists");
            setCodeValid(false);
            return;
          }
        }

        setCodeValid(true);
        setCodeError(null);
      } catch (error) {
        console.error("Error validating code:", error);
        setCodeError("Failed to validate installer code");
        setCodeValid(false);
      } finally {
        setCodeValidating(false);
      }
    },
    [trainingCenter, excludeCode]
  );

  useEffect(() => {
    // Only auto-generate if: training center is selected, manual edit is disabled, and code is empty
    // This prevents overwriting existing codes when editing
    if (trainingCenter && !allowManualEdit && !installerCode) {
      generateInstallerCode();
    }
  }, [trainingCenter, allowManualEdit, installerCode, generateInstallerCode]);

  useEffect(() => {
    if (allowManualEdit && installerCode && trainingCenter) {
      const timeoutId = setTimeout(() => {
        validateManualCode(installerCode);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [installerCode, allowManualEdit, trainingCenter, validateManualCode]);

  const handleInstallerCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setInstallerCode(upperValue);
    setCodeValid(false);
    if (!upperValue) {
      setCodeError(null);
    }
  };

  return {
    installerCode,
    codeGenerating,
    codeValidating,
    codeError,
    codeValid,
    handleInstallerCodeChange,
    setInstallerCode,
  };
}
