import { z } from 'zod';
import { TeamRole } from '@/types/roles';
import { PaymentStatus } from '@/types/rewards';

// Phone number formatter: converts to +92XXXXXXXXXX format
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.startsWith('92')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return `+92${cleaned}`;
}

// Team Member Schemas
export const registerTeamMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(TeamRole),
});

export const updateTeamMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.nativeEnum(TeamRole).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Installer Schemas
export const registerInstallerSchema = z.object({
  installerCode: z.string().min(1, 'Installer code is required').toUpperCase(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  referrerCode: z.string().optional(),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in format: 12345-1234567-1'),
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .transform(formatPhoneNumber),
  whatsappNumber: z.string()
    .min(10, 'WhatsApp number must be at least 10 digits')
    .transform(formatPhoneNumber),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  trainingCenter: z.string().min(2, 'Training center is required'),
  companyName: z.string().optional(),
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  accountTitle: z.string().min(2, 'Account title is required'),
  certified: z.boolean().default(false),
});

export const updateInstallerSchema = registerInstallerSchema.omit({ installerCode: true }).partial();

// Installer Reward Schemas
export const registerRewardSchema = z.object({
  installerCode: z.string().min(1, 'Installer code is required').toUpperCase(),
  cityOfInstallation: z.string().min(2, 'City of installation is required'),
  productModel: z.string().min(1, 'Product model is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  serialNumberStatus: z.string().min(1, 'Serial number status is required'),
  inverterSerialNumber: z.string().min(1, 'Inverter serial number is required'),
  installationDate: z.string().optional(),
  rewardAmount: z.number().min(0, 'Reward amount must be positive'),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  transactionId: z.string().optional(),
  sendingDate: z.string().or(z.date()).optional(),
  paymentMethod: z.string().optional(),
});

export const updateRewardSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required').optional(),
  cityOfInstallation: z.string().min(2, 'City of installation is required').optional(),
  productModel: z.string().min(1, 'Product model is required').optional(),
  serialNumberStatus: z.string().min(1, 'Serial number status is required').optional(),
  inverterSerialNumber: z.string().min(1, 'Inverter serial number is required').optional(),
  rewardAmount: z.number().min(0, 'Reward amount must be positive').optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  transactionId: z.string().optional(),
  referrerTransactionId: z.string().optional(),
  referrerRewardAmount: z.number().min(0).optional(),
  sendingDate: z.string().or(z.date()).optional(),
  paymentMethod: z.string().optional(),
});

export type RegisterTeamMemberInput = z.infer<typeof registerTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RegisterInstallerInput = z.infer<typeof registerInstallerSchema>;
export type UpdateInstallerInput = z.infer<typeof updateInstallerSchema>;
export type RegisterRewardInput = z.infer<typeof registerRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
