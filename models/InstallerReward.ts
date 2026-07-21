/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Model, Types } from "mongoose";
import { RewardStatus, ProductStatus } from "@/types/rewards";
import Product from "@/models/Product";

// Re-export for backward compatibility
export { RewardStatus, ProductStatus };

export interface IInstallerReward {
  _id?: string;
  registeredBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  installer: Types.ObjectId;
  installerCode: string;
  referrerCode?: string;
  referrer?: Types.ObjectId;
  cityOfInstallation: string;
  productModel: string;
  serialNumber: string;
  inverterSerialNumber: string;
  installationDate?: Date;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  rewardStatus: RewardStatus;
  productStatus: ProductStatus;
  rejectionReason?: string;
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
      ref: "TeamMember",
      required: [true, "Registered by is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
    },
    installer: {
      type: Schema.Types.ObjectId,
      ref: "Installer",
      required: [true, "Installer is required"],
    },
    installerCode: {
      type: String,
      required: [true, "Installer code is required"],
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
      ref: "Installer",
    },
    cityOfInstallation: {
      type: String,
      required: [true, "City of installation is required"],
      trim: true,
    },
    productModel: {
      type: String,
      required: [true, "Product model is required"],
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, "Serial number is required"],
      unique: true,
      trim: true,
    },
    inverterSerialNumber: {
      type: String,
      trim: true,
      default: "",
    },
    installationDate: {
      type: Date,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      trim: true,
      uppercase: true,
    },
    accountTitle: {
      type: String,
      required: [true, "Account title is required"],
      trim: true,
    },
    rewardStatus: {
      type: String,
      enum: Object.values(RewardStatus),
      default: RewardStatus.PENDING,
      required: true,
    },
    productStatus: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ELIGIBLE,
      required: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    rewardAmount: {
      type: Number,
      required: [true, "Reward amount is required"],
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

// Custom validation for inverter serial number
InstallerRewardSchema.pre("save", async function (next) {
  const product = await Product.findOne({ name: this.productModel }).lean();

  if (product?.requiresInverter) {
    if (!this.inverterSerialNumber || this.inverterSerialNumber.trim() === "") {
      return next(
        new Error("Inverter serial number is required for this product")
      );
    }
  }

  next();
});

// Validation for updates
InstallerRewardSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  async function (next) {
    const update = this.getUpdate() as any;
    const productModel = update.productModel || update.$set?.productModel;

    if (productModel) {
      const product = await Product.findOne({ name: productModel }).lean();
      const inverterSerial =
        update.inverterSerialNumber || update.$set?.inverterSerialNumber;

      if (product?.requiresInverter) {
        if (
          !inverterSerial ||
          (typeof inverterSerial === "string" && inverterSerial.trim() === "")
        ) {
          return next(
            new Error("Inverter serial number is required for this product")
          );
        }
      }
    }

    next();
  }
);

// Indexes for better query performance
// Note: serialNumber already has a unique index, no need to add it again
InstallerRewardSchema.index({ installer: 1 });
InstallerRewardSchema.index({ installerCode: 1 });
InstallerRewardSchema.index({ referrer: 1 });
InstallerRewardSchema.index({ rewardStatus: 1 });
InstallerRewardSchema.index({ productStatus: 1 });
// Payment format / templates select ELIGIBLE rows by payment state.
InstallerRewardSchema.index({ productStatus: 1, rewardStatus: 1 });
InstallerRewardSchema.index({ cityOfInstallation: 1 });
InstallerRewardSchema.index({ productModel: 1 });
InstallerRewardSchema.index({ sendingDate: 1 });
InstallerRewardSchema.index({ registeredBy: 1 });
InstallerRewardSchema.index({ updatedBy: 1 });
InstallerRewardSchema.index({ createdAt: 1 });

// Compound indexes for common queries
InstallerRewardSchema.index({ installer: 1, rewardStatus: 1 });
InstallerRewardSchema.index({ rewardStatus: 1, sendingDate: 1 });
// Compound index for dashboard aggregations (referrer lookups with date filtering)
InstallerRewardSchema.index({ referrer: 1, createdAt: -1 });

const InstallerReward: Model<IInstallerReward> =
  mongoose.models.InstallerReward ||
  mongoose.model<IInstallerReward>("InstallerReward", InstallerRewardSchema);

export default InstallerReward;
