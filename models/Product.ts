import mongoose, { Schema, Model } from 'mongoose';

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

// One-time seed data. The DB Product collection is the source of truth once
// seeded (admin CRUD via /api/products); this list only bootstraps an empty
// collection on first read. Not exported: nothing but getProducts() should
// read product data from a static list.
const SEED_PRODUCTS: ReadonlyArray<
  Pick<IProduct, 'name' | 'reward' | 'requiresInverter' | 'isBattery'>
> = [
  // BATTERIES WITH INVERTERS
  { name: 'TP LD-51 Battery with Fronus Inverter', reward: 2000, requiresInverter: true, isBattery: true },
  { name: 'Fronus 5.12kW Battery with Fronus Inverter', reward: 2000, requiresInverter: true, isBattery: true },
  { name: 'TP LD-55 Ultra Battery with Fronus Inverter', reward: 2000, requiresInverter: true, isBattery: true },
  { name: 'Titan 2.5kw Battery with Fronus Inverter', reward: 2000, requiresInverter: true, isBattery: true },
  { name: 'Titan 15kW Battery with Fronus Inverter', reward: 2000, requiresInverter: true, isBattery: true },
  // PARALLEL BATTERIES
  { name: 'TP LD-51 Battery Parallel', reward: 2000, requiresInverter: false, isBattery: true },
  { name: 'Fronus 5.12kW Battery Parallel', reward: 2000, requiresInverter: false, isBattery: true },
  { name: 'TP LD-55 Ultra Battery Parallel', reward: 2000, requiresInverter: false, isBattery: true },
  { name: 'Titan 2.5kw Battery Parallel', reward: 2000, requiresInverter: false, isBattery: true },
  { name: 'Titan 15kW Battery Parallel', reward: 2000, requiresInverter: false, isBattery: true },
  // BATTERIES
  { name: 'TP LD-51 Battery', reward: 1500, requiresInverter: false, isBattery: true },
  { name: 'Fronus 5.12kW Battery', reward: 1500, requiresInverter: false, isBattery: true },
  { name: 'TP LD-55 Ultra Battery', reward: 1500, requiresInverter: false, isBattery: true },
  { name: 'Titan 2.5kw Battery', reward: 1500, requiresInverter: false, isBattery: true },
  { name: 'Titan 15kW Battery', reward: 1500, requiresInverter: false, isBattery: true },
  // INVERTERS
  { name: '4.2kW - PV 5200', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '6.2kW - PV 7200', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '8kW - PV 9200', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '10kW - PV 12200', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '6KW - X1 Genki', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '8kW - X1 Genki', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '10kW - X1 Genki', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '12kW - X1 Genki', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '10kW - X3 Genki', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '15kW - X3 Genki', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '5KW - X3 Mic G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '10KW - X3 Mic G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '15KW - X3 Mic G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '20KW - X3 Pro G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '25KW - X3 Pro G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '30KW - X3 Pro G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '40KW - X3 Mega G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '50KW - X3 Mega G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '60KW - X3 Mega G2', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '80KW - X3 Forth', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '100KW - X3 Forth', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '110KW - X3 Forth', reward: 1500, requiresInverter: false, isBattery: false },
  { name: '125KW - X3 Forth', reward: 1500, requiresInverter: false, isBattery: false },
];

// Get all products, seeding the collection on first read if empty.
export async function getProducts(): Promise<IProduct[]> {
  const count = await Product.countDocuments();

  if (count === 0) {
    await Product.insertMany(
      SEED_PRODUCTS.map((product, index) => ({
        ...product,
        active: true,
        order: index,
      }))
    );
  }

  return Product.find().sort({ order: 1, name: 1 }).lean();
}
