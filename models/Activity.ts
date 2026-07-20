/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Model, Types } from 'mongoose';

export enum ActivityType {
  // Installer Activities
  INSTALLER_REGISTERED = 'INSTALLER_REGISTERED',
  INSTALLER_UPDATED = 'INSTALLER_UPDATED',
  INSTALLER_DELETED = 'INSTALLER_DELETED',

  // Reward Activities
  REWARD_REGISTERED = 'REWARD_REGISTERED',
  REWARD_UPDATED = 'REWARD_UPDATED',
  REWARD_DELETED = 'REWARD_DELETED',
  REWARD_MARKED_PAID = 'REWARD_MARKED_PAID',
  REWARD_MARKED_FAILED = 'REWARD_MARKED_FAILED',

  // Warning / Suspension Activities
  WARNING_ISSUED = 'WARNING_ISSUED',
  WARNING_REVOKED = 'WARNING_REVOKED',
  INSTALLER_SUSPENDED = 'INSTALLER_SUSPENDED',
  INSTALLER_UNSUSPENDED = 'INSTALLER_UNSUSPENDED',

  // Team Activities
  TEAM_MEMBER_REGISTERED = 'TEAM_MEMBER_REGISTERED',
  TEAM_MEMBER_UPDATED = 'TEAM_MEMBER_UPDATED',
  TEAM_MEMBER_DELETED = 'TEAM_MEMBER_DELETED',

  // WhatsApp Notifications
  WHATSAPP_SENT = 'WHATSAPP_SENT',
  WHATSAPP_FAILED = 'WHATSAPP_FAILED',
  WHATSAPP_RECEIVED = 'WHATSAPP_RECEIVED',
  WHATSAPP_FREE_FORM_SENT = 'WHATSAPP_FREE_FORM_SENT',
}

export interface IActivity {
  _id?: string;
  type: ActivityType;
  performedBy: Types.ObjectId; // Team member who performed the action
  targetType: 'Installer' | 'InstallerReward' | 'TeamMember';
  targetId: Types.ObjectId; // ID of the affected entity
  targetName?: string; // Human-readable name for quick reference
  description: string; // Human-readable description
  metadata?: {
    changes?: Record<string, any>; // Before/after values for updates
    whatsappNumber?: string;
    errorMessage?: string;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'TeamMember',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['Installer', 'InstallerReward', 'TeamMember'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ActivitySchema.index({ performedBy: 1, createdAt: -1 });
ActivitySchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: -1 }); // For recent activities

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
