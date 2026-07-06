import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IInstaller {
  _id?: string;
  installerCode: string;
  fullName: string;
  referrerCode?: string;
  referrer?: Types.ObjectId | IInstaller;
  cnic: string; // Primary key
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  district: string;
  companyName?: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  registeredBy: Types.ObjectId;
  certified: boolean;
  googleContactId?: string;
  pin?: string; // bcrypt hash, hidden from queries by default
  pinPlain?: string; // plain text, visible to team members on profile
  shareToken?: string;
  lastPinChangeAt?: Date;
  pinAttempts?: number;
  pinLockedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const InstallerSchema = new Schema<IInstaller>(
  {
    installerCode: {
      type: String,
      required: [true, 'Installer code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
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
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
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
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'TeamMember',
      required: [true, 'Registered by is required'],
    },
    certified: {
      type: Boolean,
      default: false,
    },
    googleContactId: {
      type: String,
    },
    pin: {
      type: String,
      select: false, // Never returned unless explicitly .select('+pin')
    },
    pinPlain: {
      type: String,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // Installers created before this field existed have none
      default: () => crypto.randomUUID(),
    },
    lastPinChangeAt: {
      type: Date,
    },
    pinAttempts: {
      type: Number,
      default: 0,
    },
    pinLockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: installerCode and cnic already have unique indexes, no need to add them again
InstallerSchema.index({ referrerCode: 1 });
InstallerSchema.index({ city: 1 });
InstallerSchema.index({ province: 1 });
InstallerSchema.index({ district: 1 });
InstallerSchema.index({ certified: 1 });
InstallerSchema.index({ registeredBy: 1 });

// Validate referrer before saving
InstallerSchema.pre('save', async function (next) {
  if (this.referrerCode && !this.referrer) {
    const Installer = mongoose.model<IInstaller>('Installer');
    const referrer = await Installer.findOne({ installerCode: this.referrerCode });
    if (referrer) {
      this.referrer = referrer._id as unknown as Types.ObjectId;
    }
  }
  next();
});

const Installer: Model<IInstaller> =
  mongoose.models.Installer || mongoose.model<IInstaller>('Installer', InstallerSchema);

export default Installer;
