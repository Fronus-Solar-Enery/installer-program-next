import mongoose, { Schema, Model, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export interface IInstallerReward {
  _id?: string;
  registeredBy: Types.ObjectId;
  installer: Types.ObjectId;
  installerCode: string;
  referrerCode?: string;
  referrer?: Types.ObjectId;
  cityOfInstallation: string;
  productModel: string;
  serialNumber: string; // Primary key
  serialNumberStatus: string;
  inverterSerialNumber: string;
  installationDate?: Date;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  rewardAmount: number;
  referrerTransactionId?: string;
  referrerRewardAmount?: number;
  sendingDate?: Date;
  paymentMethod?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InstallerRewardSchema = new Schema<IInstallerReward>(
  {
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'TeamMember',
      required: [true, 'Registered by is required'],
    },
    installer: {
      type: Schema.Types.ObjectId,
      ref: 'Installer',
      required: [true, 'Installer is required'],
    },
    installerCode: {
      type: String,
      required: [true, 'Installer code is required'],
      trim: true,
      uppercase: true,
    },
    referrerCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'Installer',
    },
    cityOfInstallation: {
      type: String,
      required: [true, 'City of installation is required'],
      trim: true,
    },
    productModel: {
      type: String,
      required: [true, 'Product model is required'],
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    serialNumberStatus: {
      type: String,
      required: [true, 'Serial number status is required'],
      trim: true,
    },
    inverterSerialNumber: {
      type: String,
      required: [true, 'Inverter serial number is required'],
      trim: true,
    },
    installationDate: {
      type: Date,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
    },
    accountTitle: {
      type: String,
      required: [true, 'Account title is required'],
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    rewardAmount: {
      type: Number,
      required: [true, 'Reward amount is required'],
      min: 0,
    },
    referrerTransactionId: {
      type: String,
      trim: true,
    },
    referrerRewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sendingDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: serialNumber already has a unique index, no need to add it again
InstallerRewardSchema.index({ installer: 1 });
InstallerRewardSchema.index({ installerCode: 1 });
InstallerRewardSchema.index({ referrer: 1 });
InstallerRewardSchema.index({ paymentStatus: 1 });
InstallerRewardSchema.index({ cityOfInstallation: 1 });
InstallerRewardSchema.index({ productModel: 1 });
InstallerRewardSchema.index({ sendingDate: 1 });
InstallerRewardSchema.index({ registeredBy: 1 });
InstallerRewardSchema.index({ createdAt: 1 });

// Compound indexes for common queries
InstallerRewardSchema.index({ installer: 1, paymentStatus: 1 });
InstallerRewardSchema.index({ paymentStatus: 1, sendingDate: 1 });

const InstallerReward: Model<IInstallerReward> =
  mongoose.models.InstallerReward ||
  mongoose.model<IInstallerReward>('InstallerReward', InstallerRewardSchema);

export default InstallerReward;
