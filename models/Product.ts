import mongoose, { Schema, Model } from 'mongoose';
import { PRODUCT_MODELS } from '@/lib/constants';

export interface IProduct {
  _id?: string;
  name: string;
  reward: number;
  requiresInverter: boolean;
  isBattery: boolean;
  active: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      unique: true,
      trim: true,
    },
    reward: {
      type: Number,
      required: [true, 'Reward amount is required'],
      min: 0,
    },
    requiresInverter: {
      type: Boolean,
      default: false,
    },
    isBattery: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

// Get all products, seeding from the legacy PRODUCT_MODELS constant on first read.
export async function getProducts(): Promise<IProduct[]> {
  const count = await Product.countDocuments();

  if (count === 0) {
    await Product.insertMany(
      PRODUCT_MODELS.map((product, index) => ({
        name: product.value,
        reward: product.reward ?? 0,
        requiresInverter: product.requiresInverter ?? false,
        isBattery: product.isBattery ?? false,
        active: true,
        order: index,
      }))
    );
  }

  return Product.find().sort({ order: 1, name: 1 }).lean();
}
