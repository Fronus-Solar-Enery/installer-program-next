import mongoose, { Schema, Model, Types } from "mongoose";

// One snapshot row per successfully-updated reward in a bulk-update file.
export interface IRewardArchiveRecord {
  serialNumber: string;
  installerCode?: string;
  accountTitle?: string;
  transactionId?: string;
  referrerTransactionId?: string;
  rewardStatus: string;
  paymentMethod?: string;
  sendingDate?: Date;
  rewardAmount: number;
  referrerRewardAmount: number;
}

export interface IRewardArchive {
  _id?: string;
  // Original name of the uploaded file (e.g. "payments.xlsx").
  fileName: string;
  // Display / download name with the total-amount suffix (e.g. "payments_PKR.55000").
  archiveName: string;
  uploadedBy: Types.ObjectId;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  totalRowsInFile: number;
  totalInstallerAmount: number;
  totalReferrerAmount: number;
  totalAmount: number;
  records: IRewardArchiveRecord[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RewardArchiveRecordSchema = new Schema<IRewardArchiveRecord>(
  {
    serialNumber: { type: String, required: true },
    installerCode: String,
    accountTitle: String,
    transactionId: String,
    referrerTransactionId: String,
    rewardStatus: { type: String, required: true },
    paymentMethod: String,
    sendingDate: Date,
    rewardAmount: { type: Number, default: 0 },
    referrerRewardAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const RewardArchiveSchema = new Schema<IRewardArchive>(
  {
    fileName: { type: String, required: true, trim: true },
    archiveName: { type: String, required: true, trim: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
    },
    totalRecords: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    totalRowsInFile: { type: Number, default: 0 },
    totalInstallerAmount: { type: Number, default: 0 },
    totalReferrerAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    records: { type: [RewardArchiveRecordSchema], default: [] },
  },
  { timestamps: true }
);

RewardArchiveSchema.index({ createdAt: -1 });
RewardArchiveSchema.index({ uploadedBy: 1, createdAt: -1 });

const RewardArchive: Model<IRewardArchive> =
  mongoose.models.RewardArchive ||
  mongoose.model<IRewardArchive>("RewardArchive", RewardArchiveSchema);

export default RewardArchive;
