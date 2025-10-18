import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { formatCNIC } from "@/lib/validation-helpers";

interface InstallerResponse {
  _id: string;
  cnic?: string;
  installerCode?: string;
  fullName?: string;
}

export function useCNICValidation() {
  const [cnic, setCnic] = useState("");
  const [cnicDisplay, setCnicDisplay] = useState("");
  const [cnicChecked, setCnicChecked] = useState(false);
  const [cnicValidating, setCnicValidating] = useState(false);
  const [cnicError, setCnicError] = useState("");

  const handleCNICChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 13) {
      setCnic(digits);
      setCnicDisplay(formatCNIC(digits));
      setCnicChecked(false);
      setCnicError("");
    }
  };

  const checkCNIC = useCallback(async (cnicValue: string) => {
    if (!cnicValue || cnicValue.length < 13) {
      setCnicChecked(false);
      setCnicError("");
      return;
    }

    setCnicValidating(true);
    setCnicError("");
    try {
      const formattedCNIC = formatCNIC(cnicValue);
      const response = await fetch(`/api/installers?search=${formattedCNIC}`);
      const data = await response.json();

      if (data.success && data.data.installers.length > 0) {
        const existing = data.data.installers.find((i: InstallerResponse) => {
          const installerCnic = i.cnic?.replace(/\D/g, "");
          return installerCnic === cnicValue;
        });
        if (existing) {
          toast.error("This CNIC is already registered");
          setCnicChecked(false);
          setCnicError("This CNIC is already registered");
          return;
        }
      }

      setCnicChecked(true);
      setCnicError("");
      toast.success("CNIC is available");
    } catch (error) {
      console.error("Error checking CNIC:", error);
      toast.error("Failed to check CNIC");
      setCnicChecked(false);
      setCnicError("Failed to check CNIC");
    } finally {
      setCnicValidating(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cnic && cnic.length === 13) {
        checkCNIC(cnic);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [cnic, checkCNIC]);

  return {
    cnic,
    cnicDisplay,
    cnicChecked,
    cnicValidating,
    cnicError,
    handleCNICChange,
  };
}
