import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBatchJob extends Document {
  _id: mongoose.Types.ObjectId;
  type: "GOOGLE_CONTACTS_CREATE" | "GOOGLE_CONTACTS_DELETE";
  status: "pending" | "processing" | "completed" | "failed";
  totalItems: number;
  processedItems: number;
  successCount: number;
  failedCount: number;
  currentBatch?: number;
  totalBatches?: number;
  metadata?: {
    installerIds?: string[];
    errors?: string[];
    [key: string]: unknown;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const BatchJobSchema = new Schema<IBatchJob>(
  {
    type: {
      type: String,
      enum: ["GOOGLE_CONTACTS_CREATE", "GOOGLE_CONTACTS_DELETE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0,
    },
    processedItems: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    currentBatch: {
      type: Number,
    },
    totalBatches: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
BatchJobSchema.index({ createdBy: 1, createdAt: -1 });
BatchJobSchema.index({ status: 1, createdAt: -1 });
// Compound index for activeOnly queries (createdBy + status + sort)
BatchJobSchema.index({ createdBy: 1, status: 1, createdAt: -1 });

const BatchJob: Model<IBatchJob> =
  mongoose.models.BatchJob ||
  mongoose.model<IBatchJob>("BatchJob", BatchJobSchema);

export default BatchJob;
