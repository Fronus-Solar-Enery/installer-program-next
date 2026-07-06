import mongoose from "mongoose";

export interface IRateLimit {
  key: string;
  hits: Date[];
  expiresAt: Date;
}

const rateLimitSchema = new mongoose.Schema<IRateLimit>({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  // Timestamps of failed attempts within the current window.
  hits: {
    type: [Date],
    default: [],
  },
  // Slides forward on each recorded failure; TTL index removes idle keys.
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

const RateLimit =
  (mongoose.models.RateLimit as mongoose.Model<IRateLimit>) ||
  mongoose.model<IRateLimit>("RateLimit", rateLimitSchema);

export default RateLimit;
