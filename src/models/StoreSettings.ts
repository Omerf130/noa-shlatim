import mongoose, { Schema, type InferSchemaType } from "mongoose";

const STORE_SETTINGS_SINGLETON_KEY = "global";

const shippingMethodSchema = new Schema(
  {
    id: { type: String, required: true },
    displayName: { type: String, required: true, default: "" },
    enabled: { type: Boolean, required: true, default: false },
    priceMinor: { type: Number, required: false, default: null },
    instructions: { type: String, required: false, default: "" },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const storeSettingsSchema = new Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      default: STORE_SETTINGS_SINGLETON_KEY,
      unique: true,
      enum: [STORE_SETTINGS_SINGLETON_KEY],
    },
    currency: {
      type: String,
      required: true,
      default: "ILS",
      enum: ["ILS"],
    },
    pricing: {
      woodPriceMinor: { type: Number, required: false, default: null },
      magnetPriceMinor: { type: Number, required: false, default: null },
      woodEnabled: { type: Boolean, required: false, default: true },
      magnetEnabled: { type: Boolean, required: false, default: true },
    },
    shippingMethods: {
      type: [shippingMethodSchema],
      default: [],
    },
  },
  { timestamps: true },
);

function isValidMinor(v: unknown): boolean {
  if (v === null || v === undefined) {
    return true;
  }
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 10_000_000;
}

storeSettingsSchema.path("pricing.woodPriceMinor").validate({
  validator: isValidMinor,
  message: "Invalid wood price",
});

storeSettingsSchema.path("pricing.magnetPriceMinor").validate({
  validator: isValidMinor,
  message: "Invalid magnet price",
});

export type StoreSettingsDocument = InferSchemaType<typeof storeSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type StoreShippingMethod = {
  id: string;
  displayName: string;
  enabled: boolean;
  priceMinor: number | null;
  instructions: string;
  sortOrder: number;
};

export const STORE_SETTINGS_KEY = STORE_SETTINGS_SINGLETON_KEY;

export const StoreSettings =
  mongoose.models.StoreSettings ??
  mongoose.model("StoreSettings", storeSettingsSchema);
