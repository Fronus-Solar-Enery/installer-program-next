export const formatCNIC = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
};

export const formatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const validateCNIC = (cnic: string): boolean => {
  return cnic.length === 13;
};

export const validatePhoneNumber = (phone: string): boolean => {
  return phone.length === 11 && phone.startsWith("03");
};

export const validateAccountNumber = (
  accountNumber: string,
  isDigitalPayment: boolean
): boolean => {
  if (isDigitalPayment) {
    return accountNumber.length === 11 && accountNumber.startsWith("03");
  }
  return accountNumber.trim().length > 0;
};
