import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface InstallerResponse {
  _id: string;
  cnic?: string;
  installerCode?: string;
  fullName?: string;
  createdAt?: string;
  city?: string;
  certified?: boolean;
}

export function useReferrerValidation() {
  const [referrerCode, setReferrerCode] = useState("");
  const [referrerValidating, setReferrerValidating] = useState(false);
  const [referrerData, setReferrerData] = useState<InstallerResponse | null>(
    null
  );
  const [referrerError, setReferrerError] = useState("");

  const validateReferrerCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setReferrerData(null);
      setReferrerError("");
      return;
    }

    setReferrerValidating(true);
    try {
      const response = await fetch(`/api/installers?search=${code}`);
      const data = await response.json();

      if (data.success && data.data.installers.length > 0) {
        const referrer = data.data.installers.find(
          (i: InstallerResponse) =>
            i.installerCode?.toUpperCase() === code.toUpperCase()
        );

        if (referrer) {
          setReferrerData(referrer);
          setReferrerError("");
          toast.success(`Referrer found: ${referrer.fullName}`);
        } else {
          setReferrerData(null);
          setReferrerError("Referrer code not found");
          toast.error("Referrer code not found");
        }
      } else {
        setReferrerData(null);
        setReferrerError("Referrer code not found");
        toast.error("Referrer code not found");
      }
    } catch (error) {
      console.error("Error validating referrer:", error);
      setReferrerError("Failed to validate referrer code");
      toast.error("Failed to validate referrer code");
    } finally {
      setReferrerValidating(false);
    }
  }, []);

  const handleReferrerChange = (value: string) => {
    setReferrerCode(value.toUpperCase());
    setReferrerData(null);
    setReferrerError("");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (referrerCode.trim()) {
        validateReferrerCode(referrerCode);
      } else {
        setReferrerData(null);
        setReferrerError("");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [referrerCode, validateReferrerCode]);

  return {
    referrerCode,
    referrerValidating,
    referrerData,
    referrerError,
    handleReferrerChange,
    setReferrerCode,
  };
}
