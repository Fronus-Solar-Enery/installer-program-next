import mongoose, { Schema, Model } from 'mongoose';
import { TeamRole } from '@/types/roles';

// Re-export for backward compatibility
export { TeamRole };

export interface ITeamMember {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: TeamRole;
  googleId?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: ITeamMember) {
        return !this.googleId;
      },
    },
    role: {
      type: String,
      enum: Object.values(TeamRole),
      default: TeamRole.USER,
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: email and googleId already have unique indexes from schema definition
TeamMemberSchema.index({ role: 1 });

const TeamMember: Model<ITeamMember> =
  mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);

export default TeamMember;
