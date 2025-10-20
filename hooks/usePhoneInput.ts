import { useState, useEffect, useCallback } from "react";
import { formatPhoneNumber } from "@/lib/validation-helpers";

interface UsePhoneInputOptions {
  initialValue?: string;
  debounceMs?: number;
}

/**
 * Custom hook for phone number input with auto-masking and debounce
 * - Automatically prefills "03" when input is focused
 * - Applies mask (03##-#######) after debounce
 * - Handles various input formats
 */
export function usePhoneInput(
  onChange: (value: string) => void,
  options: UsePhoneInputOptions = {}
) {
  const { initialValue = "", debounceMs = 500 } = options;

  const [displayValue, setDisplayValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Handle input change with immediate display update
  const handleChange = useCallback((value: string) => {
    // Remove all non-digit characters for processing
    let digits = value.replace(/\D/g, "");

    // Auto-prefill "03" if empty or doesn't start with it
    if (digits.length === 0) {
      setDisplayValue("");
      return;
    }

    // If user types a single digit that's not 0, prepend "03"
    if (digits.length === 1 && !digits.startsWith("0")) {
      digits = "03" + digits;
    }

    // If starts with 0 but not 03, replace with 03
    if (digits.startsWith("0") && !digits.startsWith("03")) {
      digits = "03" + digits.slice(1);
    }

    // Ensure it starts with 03
    if (!digits.startsWith("03") && digits.length > 1) {
      // Handle case where user pastes number starting with 3
      if (digits.startsWith("3")) {
        digits = "0" + digits;
      }
    }

    // Limit to 11 digits
    digits = digits.slice(0, 11);

    // Update display value immediately (without mask during typing)
    setDisplayValue(digits);
  }, []);

  // Apply formatting after debounce
  useEffect(() => {
    if (!displayValue) {
      onChange("");
      return;
    }

    const timer = setTimeout(() => {
      const formatted = formatPhoneNumber(displayValue);
      setDisplayValue(formatted);
      onChange(formatted);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [displayValue, debounceMs, onChange]);

  // Handle focus - prefill "03" if empty
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (!displayValue) {
      setDisplayValue("03");
    }
  }, [displayValue]);

  // Handle blur - apply final formatting
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (displayValue) {
      const formatted = formatPhoneNumber(displayValue);
      setDisplayValue(formatted);
      onChange(formatted);
    }
  }, [displayValue, onChange]);

  return {
    value: displayValue,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    setValue: setDisplayValue,
  };
}
