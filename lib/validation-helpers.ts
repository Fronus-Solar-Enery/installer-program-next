export const formatCNIC = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
};

/**
 * Format phone number for display with mask: 03##-#######
 * Accepts various formats and normalizes to masked format
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, "");

  // Handle different input formats
  if (digits.startsWith("92") && digits.length >= 12) {
    // Format: 923477211767 -> extract 3477211767
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("3") && digits.length === 10) {
    // Format: 3477211767 -> 03477211767
    digits = "0" + digits;
  }

  // Ensure it starts with 03
  if (!digits.startsWith("03")) {
    return digits;
  }

  // Apply mask: 03##-#######
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
};

/**
 * Convert masked phone number to database format: +923477211767
 * Handles various input formats:
 * - 0347-7211767 (masked)
 * - 03477211767
 * - 3477211767
 * - 923477211767
 * - +923477211767
 */
export const phoneNumberToDBFormat = (value: string): string => {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, "");

  // Handle different formats
  if (digits.startsWith("92") && digits.length >= 12) {
    // Already in 92... format
    return "+" + digits.slice(0, 12);
  } else if (digits.startsWith("03") && digits.length === 11) {
    // Format: 03477211767 -> +923477211767
    return "+92" + digits.slice(1);
  } else if (digits.startsWith("3") && digits.length === 10) {
    // Format: 3477211767 -> +923477211767
    return "+92" + digits;
  }

  // If format is unrecognized, return as is (validation will catch it)
  return value;
};

export const validateCNIC = (cnic: string): boolean => {
  return cnic.length === 13;
};

/**
 * Validate phone number in masked format: 0347-7211767
 * Length should be 12 (11 digits + 1 dash)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("03");
};

/**
 * Validate account number (for digital payments, validates masked phone format)
 */
export const validateAccountNumber = (
  accountNumber: string,
  isDigitalPayment: boolean
): boolean => {
  if (isDigitalPayment) {
    const digits = accountNumber.replace(/\D/g, "");
    return digits.length === 11 && digits.startsWith("03");
  }
  return accountNumber.trim().length > 0;
};
